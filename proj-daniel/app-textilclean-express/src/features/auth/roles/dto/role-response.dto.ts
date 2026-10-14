import { Role, RoleI } from "../role.model";

export type RoleResponseDto = RoleI;

export function toRoleResponse(role: Role): RoleResponseDto {
  return role.toJSON() as RoleI;
}