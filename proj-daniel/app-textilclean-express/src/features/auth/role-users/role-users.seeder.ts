import { Role } from "../roles/role.model";
import { User } from "../users/user.model";
import { RoleUser } from "./role-user.model";

export const SEED_ROLE_USERS = [
  { username: "admin", roleName: "ADMIN" },
  { username: "seller", roleName: "SELLER" },
] as const;

export async function seedRoleUsers(): Promise<number> {
  let created = 0;
  for (const item of SEED_ROLE_USERS) {
    const user = await User.findOne({ where: { username: item.username } });
    const role = await Role.findOne({ where: { name: item.roleName } });
    if (!user || !role || user.status !== "active" || role.status !== "active") continue;
    const [assignment, wasCreated] = await RoleUser.findOrCreate({
      where: { user_id: user.id, role_id: role.id },
      defaults: { user_id: user.id, role_id: role.id, status: "active" },
    });
    if (wasCreated) created += 1;
    else if (assignment.status !== "active") await assignment.update({ status: "active" });
  }
  return created;
}