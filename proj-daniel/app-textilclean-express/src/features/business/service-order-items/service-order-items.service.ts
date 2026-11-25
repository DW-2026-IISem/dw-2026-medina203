import { Transaction } from "sequelize";
import {
  CreateServiceOrderItemDto,
  PatchServiceOrderItemDto,
  ServiceOrderItemResponseDto,
  UpdateServiceOrderItemDto,
  toServiceOrderItemResponse,
} from "./dto";
import { ServiceOrderItem } from "./service-order-item.model";
import { ServiceOrderItemsRepository } from "./service-order-items.repository";
import { computeOrderLine } from "./order-line";
import { ServiceOrdersRepository } from "../service-orders/service-orders.repository";
import { ServiceOrder } from "../service-orders/service-order.model";
import { recalcOrderTotals } from "../service-orders/order-totals";
import { LaundryServicesRepository } from "../laundry-services/laundry-services.repository";
import { LaundryService } from "../laundry-services/laundry-service.model";
import { AppError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";

/**
 * Service de ServiceOrderItems (líneas de orden).
 *
 * Toda escritura: transacción + candados en el orden
 * service_orders → laundry_services → service_order_items, y recálculo de
 * los totales de la orden. Una orden entregada no admite cambios (409).
 */
export class ServiceOrderItemsService {
  public constructor(
    private readonly repository: ServiceOrderItemsRepository = new ServiceOrderItemsRepository(),
    private readonly ordersRepository: ServiceOrdersRepository = new ServiceOrdersRepository(),
    private readonly servicesRepository: LaundryServicesRepository = new LaundryServicesRepository()
  ) {}

  // ================== READ ==================
  public async getAll(query: Record<string, unknown> = {}): Promise<ServiceOrderItemResponseDto[]> {
    let orderId: number | undefined;
    if (query.service_order_id !== undefined) {
      orderId = Number(query.service_order_id);
      if (!Number.isInteger(orderId) || orderId < 1) {
        throw new AppError(400, "service_order_id must be a positive integer");
      }
    }
    return (await this.repository.findAllActive(orderId)).map(toServiceOrderItemResponse);
  }

  public async getOne(id: number): Promise<ServiceOrderItemResponseDto> {
    const item = await this.repository.findById(id);
    if (!item || item.status !== "active") throw new AppError(404, "Service order item not found");
    return toServiceOrderItemResponse(item);
  }

  // ================== CREATE ==================
  public async create(body: CreateServiceOrderItemDto): Promise<ServiceOrderItemResponseDto> {
    if (!body || !Number.isInteger(body.service_order_id) || body.service_order_id < 1 ||
        !Number.isInteger(body.laundry_service_id) || body.laundry_service_id < 1) {
      throw new AppError(400, "service_order_id and laundry_service_id must be positive integers");
    }

    const itemId = await withTransaction(async (transaction) => {
      const order = await this.lockEditableOrder(body.service_order_id, transaction);
      const service = await this.servicesRepository.findByIdForUpdate(body.laundry_service_id, transaction);
      if (!service) throw new AppError(404, "Laundry service not found");
      if (service.status !== "active") throw new AppError(400, "Laundry service must be active");

      const unitPrice = Number(service.price);
      const line = computeOrderLine(service.billing_unit, unitPrice, body);
      const item = await this.repository.create(
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
      await recalcOrderTotals(order, transaction, this.ordersRepository, this.repository);
      return item.id;
    });
    return this.getOne(itemId);
  }

  // ================== UPDATE ==================
  public async updatePut(id: number, body: UpdateServiceOrderItemDto): Promise<ServiceOrderItemResponseDto> {
    if (body?.quantity === undefined) throw new AppError(400, "quantity is required for PUT");
    return this.updateLine(id, body);
  }

  public async updatePatch(id: number, body: PatchServiceOrderItemDto): Promise<ServiceOrderItemResponseDto> {
    if (body?.quantity === undefined && body?.weight_kg === undefined) return this.getOne(id);
    return this.updateLine(id, body);
  }

  // ================== DELETE ==================
  public async deletePhysical(id: number): Promise<void> {
    await withTransaction(async (transaction) => {
      const { order, item } = await this.lockLine(id, transaction, false);
      await this.repository.delete(item, transaction);
      await recalcOrderTotals(order, transaction, this.ordersRepository, this.repository);
    });
  }

  public async deleteLogical(id: number): Promise<ServiceOrderItemResponseDto> {
    const item = await withTransaction(async (transaction) => {
      const { order, item } = await this.lockLine(id, transaction);
      await this.repository.update(item, { status: "inactive" }, transaction);
      await recalcOrderTotals(order, transaction, this.ordersRepository, this.repository);
      return item;
    });
    return toServiceOrderItemResponse(item);
  }

  // ================== HELPERS ==================
  private async updateLine(id: number, body: Partial<UpdateServiceOrderItemDto>): Promise<ServiceOrderItemResponseDto> {
    await withTransaction(async (transaction) => {
      const { order, service, item } = await this.lockLine(id, transaction);
      if (!service) throw new AppError(404, "Laundry service not found");

      // Se recalcula con el precio congelado de la línea, no con el precio actual del servicio.
      const line = computeOrderLine(service.billing_unit, Number(item.unit_price), {
        quantity: body.quantity ?? item.quantity,
        weight_kg: body.weight_kg === undefined ? item.weight_kg : body.weight_kg,
      });
      await this.repository.update(item, line, transaction);
      await recalcOrderTotals(order, transaction, this.ordersRepository, this.repository);
    });
    return this.getOne(id);
  }

  /** Bloquea la orden y verifica que esté activa y sin entregar. */
  private async lockEditableOrder(orderId: number, transaction: Transaction): Promise<ServiceOrder> {
    const order = await this.ordersRepository.findByIdForUpdate(orderId, transaction);
    if (!order || order.status !== "active") throw new AppError(404, "Service order not found");
    if (order.process_status === "delivered") throw new AppError(409, "Delivered orders cannot be modified");
    return order;
  }

  /** Candados en orden: orden → servicio → línea. */
  private async lockLine(
    id: number,
    transaction: Transaction,
    onlyActive = true
  ): Promise<{ order: ServiceOrder; service: LaundryService | null; item: ServiceOrderItem }> {
    const snapshot = await this.repository.findById(id, transaction);
    if (!snapshot) throw new AppError(404, "Service order item not found");

    const order = await this.lockEditableOrder(snapshot.service_order_id, transaction);
    const service = await this.servicesRepository.findByIdForUpdate(snapshot.laundry_service_id, transaction);
    const item = await this.repository.findByIdForUpdate(id, transaction);
    if (!item || (onlyActive && item.status !== "active")) {
      throw new AppError(404, "Service order item not found");
    }
    return { order, service, item };
  }
}
