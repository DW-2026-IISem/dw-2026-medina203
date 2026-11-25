import { CreationAttributes, Transaction } from "sequelize";
import { GarmentType, GarmentTypeI } from "./garment-type.model";

/** Repository de GarmentTypes: única capa que usa Sequelize. */
export class GarmentTypesRepository {
  public async findAllActive(): Promise<GarmentType[]> {
    return GarmentType.findAll({ where: { status: "active" }, order: [["name", "ASC"]] });
  }

  public async findById(id: number, transaction?: Transaction): Promise<GarmentType | null> {
    return GarmentType.findByPk(id, { transaction });
  }

  public async create(data: CreationAttributes<GarmentType>): Promise<GarmentType> {
    return GarmentType.create(data);
  }

  public async update(garmentType: GarmentType, data: Partial<GarmentTypeI>): Promise<GarmentType> {
    return garmentType.update(data);
  }

  public async delete(garmentType: GarmentType): Promise<void> {
    await garmentType.destroy();
  }
}
