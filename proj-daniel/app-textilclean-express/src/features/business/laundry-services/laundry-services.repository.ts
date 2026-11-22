import { CreationAttributes, Transaction } from "sequelize";
import { LaundryService, LaundryServiceI } from "./laundry-service.model";
import { GarmentType } from "../garment-types/garment-type.model";

const withGarmentType = {
  model: GarmentType,
  as: "garment_type",
  attributes: ["id", "name"],
};

/** Repository de LaundryServices: única capa que usa Sequelize. */
export class LaundryServicesRepository {
  public async findAllActive(): Promise<LaundryService[]> {
    return LaundryService.findAll({
      where: { status: "active" },
      include: [withGarmentType],
      order: [["name", "ASC"]],
    });
  }

  public async findById(id: number, transaction?: Transaction): Promise<LaundryService | null> {
    return LaundryService.findByPk(id, { include: [withGarmentType], transaction });
  }

  /** `SELECT … FOR UPDATE`: lo usan los flujos de órdenes (ISS-08) para congelar el precio. */
  public async findByIdForUpdate(id: number, transaction: Transaction): Promise<LaundryService | null> {
    return LaundryService.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  }

  public async create(data: CreationAttributes<LaundryService>): Promise<LaundryService> {
    const created = await LaundryService.create(data);
    return (await this.findById(created.id)) ?? created;
  }

  public async update(service: LaundryService, data: Partial<LaundryServiceI>): Promise<LaundryService> {
    await service.update(data);
    return (await this.findById(service.id)) ?? service;
  }

  public async delete(service: LaundryService): Promise<void> {
    await service.destroy();
  }
}
