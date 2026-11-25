import { CreationAttributes, Transaction, WhereOptions } from "sequelize";
import { ServiceOrder, ServiceOrderI } from "./service-order.model";
import { Customer } from "../customers/customer.model";
import { ServiceOrderItem } from "../service-order-items/service-order-item.model";
import { LaundryService } from "../laundry-services/laundry-service.model";

const withCustomer = { model: Customer, as: "customer", attributes: ["id", "business_name", "tax_id"] };

const withActiveItems = {
  model: ServiceOrderItem,
  as: "items",
  where: { status: "active" },
  required: false,
  include: [{ model: LaundryService, as: "laundry_service", attributes: ["id", "name", "billing_unit"] }],
};

export interface ServiceOrderFilters {
  customer_id?: number;
  process_status?: string;
}

/** Repository de ServiceOrders: única capa que usa Sequelize. */
export class ServiceOrdersRepository {
  public async findAllActive(filters: ServiceOrderFilters = {}): Promise<ServiceOrder[]> {
    const where: WhereOptions = { status: "active", ...filters };
    return ServiceOrder.findAll({ where, include: [withCustomer], order: [["received_at", "DESC"]] });
  }

  public async findById(id: number, transaction?: Transaction): Promise<ServiceOrder | null> {
    return ServiceOrder.findByPk(id, { transaction });
  }

  /** Orden con su cliente y sus líneas activas (para la respuesta de detalle). */
  public async findByIdWithDetail(id: number, transaction?: Transaction): Promise<ServiceOrder | null> {
    return ServiceOrder.findByPk(id, { include: [withCustomer, withActiveItems], transaction });
  }

  /** `SELECT … FOR UPDATE`: primer candado de los flujos de órdenes. */
  public async findByIdForUpdate(id: number, transaction: Transaction): Promise<ServiceOrder | null> {
    return ServiceOrder.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  }

  public async create(data: CreationAttributes<ServiceOrder>, transaction?: Transaction): Promise<ServiceOrder> {
    return ServiceOrder.create(data, { transaction });
  }

  public async update(order: ServiceOrder, data: Partial<ServiceOrderI>, transaction?: Transaction): Promise<ServiceOrder> {
    return order.update(data, { transaction });
  }

  public async delete(order: ServiceOrder, transaction?: Transaction): Promise<void> {
    await order.destroy({ transaction });
  }
}
