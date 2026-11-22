import { CreationAttributes, Transaction } from "sequelize";
import { ServiceOrderItem, ServiceOrderItemI } from "./service-order-item.model";
import { LaundryService } from "../laundry-services/laundry-service.model";

const withService = { model: LaundryService, as: "laundry_service", attributes: ["id", "name", "billing_unit"] };

/** Repository de ServiceOrderItems: única capa que usa Sequelize. */
export class ServiceOrderItemsRepository {
  public async findAllActive(serviceOrderId?: number): Promise<ServiceOrderItem[]> {
    const where = serviceOrderId ? { status: "active", service_order_id: serviceOrderId } : { status: "active" };
    return ServiceOrderItem.findAll({ where, include: [withService], order: [["id", "ASC"]] });
  }

  public async findById(id: number, transaction?: Transaction): Promise<ServiceOrderItem | null> {
    return ServiceOrderItem.findByPk(id, { include: [withService], transaction });
  }

  public async findByIdForUpdate(id: number, transaction: Transaction): Promise<ServiceOrderItem | null> {
    return ServiceOrderItem.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  }

  public async findActiveByOrderId(serviceOrderId: number, transaction?: Transaction): Promise<ServiceOrderItem[]> {
    return ServiceOrderItem.findAll({ where: { service_order_id: serviceOrderId, status: "active" }, transaction });
  }

  public async create(data: CreationAttributes<ServiceOrderItem>, transaction?: Transaction): Promise<ServiceOrderItem> {
    return ServiceOrderItem.create(data, { transaction });
  }

  public async update(item: ServiceOrderItem, data: Partial<ServiceOrderItemI>, transaction?: Transaction): Promise<ServiceOrderItem> {
    return item.update(data, { transaction });
  }

  public async delete(item: ServiceOrderItem, transaction?: Transaction): Promise<void> {
    await item.destroy({ transaction });
  }

  public async deleteByOrderId(serviceOrderId: number, transaction?: Transaction): Promise<number> {
    return ServiceOrderItem.destroy({ where: { service_order_id: serviceOrderId }, transaction });
  }

  public async deactivateByOrderId(serviceOrderId: number, transaction?: Transaction): Promise<number> {
    const [affected] = await ServiceOrderItem.update(
      { status: "inactive" },
      { where: { service_order_id: serviceOrderId, status: "active" }, transaction }
    );
    return affected;
  }
}
