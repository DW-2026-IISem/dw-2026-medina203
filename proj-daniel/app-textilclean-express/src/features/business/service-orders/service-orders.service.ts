import { Transaction } from "sequelize";
import { CustomersRepository } from "../customers/customers.repository";
import { LaundryServicesRepository } from "../laundry-services/laundry-services.repository";
import { LaundryService } from "../laundry-services/laundry-service.model";
import { ServiceOrderItemsRepository } from "../service-order-items/service-order-items.repository";
import { computeOrderLine } from "../service-order-items/order-line";
import { withTransaction } from "../../../shared/database/with-transaction";
import { AppError } from "../../../shared/errors/app-error";
import { nonNegativeMoney, roundMoney } from "../../../shared/utils/money";
import {
  ChangeProcessStatusDto,
  CreateServiceOrderDto,
  PatchServiceOrderDto,
  ServiceOrderResponseDto,
  UpdateServiceOrderDto,
  toServiceOrderResponse,
} from "./dto";
import { PROCESS_STATUSES, ProcessStatus, ServiceOrder } from "./service-order.model";
import { ServiceOrderFilters, ServiceOrdersRepository } from "./service-orders.repository";
import { recalcOrderTotals } from "./order-totals";

/** Transiciones válidas del proceso (solo hacia adelante, un paso a la vez). */
const NEXT_STATUS: Record<ProcessStatus, ProcessStatus | null> = {
  received: "in_process",
  in_process: "ready",
  ready: "delivered",
  delivered: null,
};

/**
 * Service de ServiceOrders.
 *
 * Orden de candados en todos los flujos: service_orders → laundry_services →
 * service_order_items (mismo orden en ServiceOrderItemsService para evitar deadlocks).
 */
export class ServiceOrdersService {
  public constructor(
    private readonly repository: ServiceOrdersRepository = new ServiceOrdersRepository(),
    private readonly customersRepository: CustomersRepository = new CustomersRepository(),
    private readonly servicesRepository: LaundryServicesRepository = new LaundryServicesRepository(),
    private readonly itemsRepository: ServiceOrderItemsRepository = new ServiceOrderItemsRepository()
  ) {}

  // ================== READ ==================
  public async getAll(query: Record<string, unknown> = {}): Promise<ServiceOrderResponseDto[]> {
    const orders = await this.repository.findAllActive(this.parseFilters(query));
    return orders.map(toServiceOrderResponse);
  }

  public async getOne(id: number): Promise<ServiceOrderResponseDto> {
    const order = await this.repository.findByIdWithDetail(id);
    if (!order || order.status !== "active") throw new AppError(404, "Service order not found");
    return toServiceOrderResponse(order);
  }

  // ================== CREATE (transaccional) ==================
  public async create(body: CreateServiceOrderDto): Promise<ServiceOrderResponseDto> {
    this.validateCreate(body);
    const tax = nonNegativeMoney(body.tax ?? 0, "tax");
    const discount = nonNegativeMoney(body.discount ?? 0, "discount");
    const receivedAt = parseDate(body.received_at ?? new Date(), "received_at");
    const requestedDelivery =
      body.delivery_date === undefined || body.delivery_date === null
        ? null
        : parseDate(body.delivery_date, "delivery_date");

    const orderId = await withTransaction(async (transaction) => {
      const customer = await this.customersRepository.findById(body.customer_id, transaction);
      if (!customer || customer.status !== "active") throw new AppError(404, "Active customer not found");

      const order = await this.repository.create(
        {
          customer_id: customer.id,
          received_at: receivedAt,
          delivery_date: requestedDelivery,
          process_status: "received",
          notes: body.notes ?? null,
          subtotal: 0,
          tax,
          discount,
          total: 0,
          status: "active",
        },
        transaction
      );

      const services = await this.lockServices(body.items.map((i) => i.laundry_service_id), transaction);

      let subtotal = 0;
      let maxHours = 0;
      for (const item of body.items) {
        const service = services.get(item.laundry_service_id)!;
        const unitPrice = Number(service.price);
        const line = computeOrderLine(service.billing_unit, unitPrice, item);
        subtotal = roundMoney(subtotal + line.line_total);
        maxHours = Math.max(maxHours, service.estimated_hours);
        await this.itemsRepository.create(
          {
            service_order_id: order.id,
            laundry_service_id: service.id,
            quantity: line.quantity,
            weight_kg: line.weight_kg,
            unit_price: unitPrice,
            line_total: line.line_total,
            status: "active",
          },
          transaction
        );
      }

      if (discount > roundMoney(subtotal + tax)) {
        throw new AppError(400, "discount cannot exceed subtotal plus tax");
      }
      const deliveryDate = requestedDelivery ?? new Date(receivedAt.getTime() + maxHours * 3600 * 1000);
      if (deliveryDate < receivedAt) throw new AppError(400, "delivery_date cannot be before received_at");

      await this.repository.update(
        order,
        { subtotal, delivery_date: deliveryDate, total: roundMoney(subtotal + tax - discount) },
        transaction
      );
      return order.id;
    });

    return this.getOne(orderId);
  }

  // ================== UPDATE ==================
  public async updatePut(id: number, body: UpdateServiceOrderDto): Promise<ServiceOrderResponseDto> {
    for (const field of ["received_at", "tax", "discount"] as const) {
      if (body?.[field] === undefined) throw new AppError(400, `${field} is required for PUT`);
    }
    return this.update(id, body);
  }

  public async updatePatch(id: number, body: PatchServiceOrderDto): Promise<ServiceOrderResponseDto> {
    return this.update(id, body ?? {});
  }

  /** Avanza el proceso: received → in_process → ready → delivered. */
  public async changeProcessStatus(id: number, body: ChangeProcessStatusDto): Promise<ServiceOrderResponseDto> {
    const next = body?.process_status;
    if (!PROCESS_STATUSES.includes(next)) {
      throw new AppError(400, `process_status must be one of: ${PROCESS_STATUSES.join(", ")}`);
    }

    await withTransaction(async (transaction) => {
      const order = await this.requireActiveForUpdate(id, transaction);
      const expected = NEXT_STATUS[order.process_status];
      if (expected !== next) {
        throw new AppError(
          409,
          expected
            ? `Invalid transition ${order.process_status} → ${next}; next allowed: ${expected}`
            : "Order already delivered"
        );
      }
      const items = await this.itemsRepository.findActiveByOrderId(order.id, transaction);
      if (items.length === 0) throw new AppError(400, "Order has no active items");

      // Al entregar, delivery_date pasa a ser la fecha real de entrega.
      const changes = next === "delivered"
        ? { process_status: next, delivery_date: new Date() }
        : { process_status: next };
      await this.repository.update(order, changes, transaction);
    });
    return this.getOne(id);
  }

  // ================== DELETE ==================
  /** Anulación (borrado lógico) de la orden y sus líneas. No aplica a órdenes entregadas. */
  public async deleteLogical(id: number): Promise<ServiceOrderResponseDto> {
    const order = await withTransaction(async (transaction) => {
      const order = await this.requireActiveForUpdate(id, transaction);
      this.assertNotDelivered(order);
      await this.itemsRepository.deactivateByOrderId(order.id, transaction);
      await this.repository.update(order, { status: "inactive" }, transaction);
      return order;
    });
    return toServiceOrderResponse(order);
  }

  /** Borrado físico de la orden y sus líneas (también purga órdenes anuladas). */
  public async deletePhysical(id: number): Promise<void> {
    await withTransaction(async (transaction) => {
      const order = await this.repository.findByIdForUpdate(id, transaction);
      if (!order) throw new AppError(404, "Service order not found");
      await this.itemsRepository.deleteByOrderId(order.id, transaction);
      await this.repository.delete(order, transaction);
    });
  }

  // ================== HELPERS ==================
  private async update(id: number, body: Partial<UpdateServiceOrderDto>): Promise<ServiceOrderResponseDto> {
    await withTransaction(async (transaction) => {
      const order = await this.requireActiveForUpdate(id, transaction);
      this.assertNotDelivered(order);

      const tax = body.tax === undefined ? Number(order.tax) : nonNegativeMoney(body.tax, "tax");
      const discount = body.discount === undefined ? Number(order.discount) : nonNegativeMoney(body.discount, "discount");
      const receivedAt = body.received_at === undefined ? order.received_at : parseDate(body.received_at, "received_at");
      const deliveryDate =
        body.delivery_date === undefined
          ? order.delivery_date
          : body.delivery_date === null
            ? null
            : parseDate(body.delivery_date, "delivery_date");

      if (deliveryDate && deliveryDate < receivedAt) {
        throw new AppError(400, "delivery_date cannot be before received_at");
      }
      if (discount > roundMoney(Number(order.subtotal) + tax)) {
        throw new AppError(400, "discount cannot exceed subtotal plus tax");
      }

      await this.repository.update(
        order,
        {
          received_at: receivedAt,
          delivery_date: deliveryDate,
          notes: body.notes === undefined ? order.notes : body.notes,
          tax,
          discount,
        },
        transaction
      );
      await recalcOrderTotals(order, transaction, this.repository, this.itemsRepository);
    });
    return this.getOne(id);
  }

  private validateCreate(body: CreateServiceOrderDto): void {
    if (!body || !Number.isInteger(body.customer_id) || body.customer_id < 1) {
      throw new AppError(400, "customer_id must be a positive integer");
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new AppError(400, "At least one item is required");
    }
    if (body.items.some((i) => !i || !Number.isInteger(i.laundry_service_id) || i.laundry_service_id < 1)) {
      throw new AppError(400, "Each item requires a valid laundry_service_id");
    }
  }

  /** Bloquea los servicios en orden ascendente de id y valida que estén activos. */
  private async lockServices(ids: number[], transaction: Transaction): Promise<Map<number, LaundryService>> {
    const services = new Map<number, LaundryService>();
    for (const id of [...new Set(ids)].sort((a, b) => a - b)) {
      const service = await this.servicesRepository.findByIdForUpdate(id, transaction);
      if (!service) throw new AppError(404, `Laundry service ${id} not found`);
      if (service.status !== "active") throw new AppError(400, `Laundry service ${id} is inactive`);
      services.set(id, service);
    }
    return services;
  }

  private async requireActiveForUpdate(id: number, transaction: Transaction): Promise<ServiceOrder> {
    const order = await this.repository.findByIdForUpdate(id, transaction);
    if (!order || order.status !== "active") throw new AppError(404, "Service order not found");
    return order;
  }

  private assertNotDelivered(order: ServiceOrder): void {
    if (order.process_status === "delivered") {
      throw new AppError(409, "Delivered orders cannot be modified");
    }
  }

  private parseFilters(query: Record<string, unknown>): ServiceOrderFilters {
    const filters: ServiceOrderFilters = {};
    if (query.customer_id !== undefined) {
      const customerId = Number(query.customer_id);
      if (!Number.isInteger(customerId) || customerId < 1) throw new AppError(400, "customer_id must be a positive integer");
      filters.customer_id = customerId;
    }
    if (query.process_status !== undefined) {
      if (!PROCESS_STATUSES.includes(query.process_status as ProcessStatus)) {
        throw new AppError(400, `process_status must be one of: ${PROCESS_STATUSES.join(", ")}`);
      }
      filters.process_status = query.process_status as ProcessStatus;
    }
    return filters;
  }
}

function parseDate(value: string | Date, field: string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new AppError(400, `Invalid ${field}`);
  return date;
}
