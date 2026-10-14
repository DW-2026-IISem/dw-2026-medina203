import { CreationAttributes } from "sequelize";
import { Role } from "./role.model";

export class RolesRepository {
  public findAllActive(): Promise<Role[]> {
    return Role.findAll({ where: { status: "active" } });
  }

  public findById(id: number): Promise<Role | null> {
    return Role.findByPk(id);
  }

  public findByName(name: string): Promise<Role | null> {
    return Role.findOne({ where: { name: name.trim().toUpperCase() } });
  }

  public create(data: CreationAttributes<Role>): Promise<Role> {
    return Role.create(data);
  }

  public update(role: Role, data: Partial<Role>): Promise<Role> {
    return role.update(data);
  }

  public async delete(role: Role): Promise<void> {
    await role.destroy();
  }
}