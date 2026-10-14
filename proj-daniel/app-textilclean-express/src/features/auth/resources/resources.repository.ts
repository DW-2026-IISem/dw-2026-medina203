import { CreationAttributes, Transaction } from "sequelize";
import { normalizePath } from "../../../shared/auth/resource-match";
import { Resource } from "./resource.model";

export class ResourcesRepository {
  public findAllActive(): Promise<Resource[]> {
    return Resource.findAll({ where: { status: "active" } });
  }

  public findById(id: number, transaction?: Transaction): Promise<Resource | null> {
    return Resource.findByPk(id, { transaction });
  }

  public findByOperation(method: string, path: string): Promise<Resource | null> {
    return Resource.findOne({ where: { method: method.trim().toUpperCase(), path: normalizePath(path.trim()) } });
  }

  public create(data: CreationAttributes<Resource>): Promise<Resource> {
    return Resource.create(data);
  }

  public update(resource: Resource, data: Partial<Resource>): Promise<Resource> {
    return resource.update(data);
  }

  public async delete(resource: Resource): Promise<void> {
    await resource.destroy();
  }
}