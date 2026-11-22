import { CreationAttributes, Transaction } from "sequelize";
import { Role } from "../roles/role.model";
import { User } from "../users/user.model";
import { RoleUser } from "./role-user.model";

const SUMMARIES = [
  { model: User, as: "user", attributes: ["id", "username", "email"] },
  { model: Role, as: "role", attributes: ["id", "name"] },
];

export class RoleUsersRepository {
  public findAllActive(): Promise<RoleUser[]> {
    return RoleUser.findAll({ where: { status: "active" }, include: SUMMARIES });
  }
  public findById(id: number, transaction?: Transaction): Promise<RoleUser | null> {
    return RoleUser.findByPk(id, { include: SUMMARIES, transaction });
  }
  public findByUserAndRole(userId: number, roleId: number): Promise<RoleUser | null> {
    return RoleUser.findOne({ where: { user_id: userId, role_id: roleId } });
  }
  /** Nombres de los roles activos asignados (activamente) a un usuario. */
  public async findActiveRoleNamesByUser(userId: number): Promise<string[]> {
    const rows = await RoleUser.findAll({
      where: { user_id: userId, status: "active" },
      include: [{ model: Role, as: "role", attributes: ["name"], where: { status: "active" }, required: true }],
    });
    return rows.map((row) => (row.toJSON() as unknown as { role: { name: string } }).role.name).sort();
  }
  public create(data: CreationAttributes<RoleUser>): Promise<RoleUser> {
    return RoleUser.create(data);
  }
  public update(roleUser: RoleUser, data: Partial<RoleUser>): Promise<RoleUser> {
    return roleUser.update(data);
  }
}