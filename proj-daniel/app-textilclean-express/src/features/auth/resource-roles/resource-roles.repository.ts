import { CreationAttributes, Op, Transaction } from "sequelize";
import { Resource } from "../resources/resource.model";
import { Role } from "../roles/role.model";
import { RoleUser } from "../role-users/role-user.model";
import { ResourceRole } from "./resource-role.model";
import { EffectivePermissionDto } from "./dto";

const SUMMARIES = [
  { model: Role, as: "role", attributes: ["id", "name"] },
  { model: Resource, as: "resource", attributes: ["id", "method", "path", "description"] },
];

export class ResourceRolesRepository {
  public findAllActiveFiltered(filters: { role_id?: number; resource_id?: number }): Promise<ResourceRole[]> {
    const where: { status: "active"; role_id?: number; resource_id?: number } = { status: "active" };
    if (filters.role_id !== undefined) where.role_id = filters.role_id;
    if (filters.resource_id !== undefined) where.resource_id = filters.resource_id;
    return ResourceRole.findAll({ where, include: SUMMARIES, order: [["id", "ASC"]] });
  }
  public findById(id: number, transaction?: Transaction): Promise<ResourceRole | null> {
    return ResourceRole.findByPk(id, { include: SUMMARIES, transaction });
  }
  public findByRoleAndResource(roleId: number, resourceId: number): Promise<ResourceRole | null> {
    return ResourceRole.findOne({ where: { role_id: roleId, resource_id: resourceId } });
  }
  public findAllByRole(roleId: number, transaction?: Transaction): Promise<ResourceRole[]> {
    return ResourceRole.findAll({ where: { role_id: roleId }, transaction, order: [["resource_id", "ASC"]] });
  }
  public create(data: CreationAttributes<ResourceRole>, transaction?: Transaction): Promise<ResourceRole> {
    return ResourceRole.create(data, { transaction });
  }
  public update(resourceRole: ResourceRole, data: Partial<ResourceRole>, transaction?: Transaction): Promise<ResourceRole> {
    return resourceRole.update(data, { transaction });
  }
  public async countActiveByRole(roleId: number): Promise<number> {
    return ResourceRole.count({ where: { role_id: roleId, status: "active" } });
  }

  public async findEffectiveForUser(userId: number): Promise<EffectivePermissionDto[]> {
    const rows = await ResourceRole.findAll({
      where: { status: "active" },
      include: [
        {
          model: Role, as: "role", required: true, attributes: ["id", "name"],
          where: { status: "active" },
          include: [{
            model: RoleUser, as: "role_users", required: true, attributes: [],
            where: { status: "active", user_id: userId },
          }],
        },
        {
          model: Resource, as: "resource", required: true,
          attributes: ["id", "method", "path", "description"], where: { status: "active" },
        },
      ],
      order: [["id", "ASC"]],
    });
    return rows.map((row) => {
      const plain = row.toJSON() as unknown as {
        role: { id: number; name: string };
        resource: { id: number; method: string; path: string; description: string | null };
      };
      return {
        resource_id: plain.resource.id,
        method: plain.resource.method,
        path: plain.resource.path,
        description: plain.resource.description,
        role_id: plain.role.id,
        role_name: plain.role.name,
      };
    });
  }

  public async findActiveResourcesByIds(ids: number[], transaction?: Transaction): Promise<Resource[]> {
    if (ids.length === 0) return [];
    return Resource.findAll({
      where: { id: { [Op.in]: ids }, status: "active" },
      attributes: ["id"],
      transaction,
      order: [["id", "ASC"]],
    });
  }
}