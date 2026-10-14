import { AppError } from "../../../shared/errors/app-error";
import { RolesRepository } from "../roles/roles.repository";
import { UsersRepository } from "../users/users.repository";
import { CreateRoleUserDto, RoleUserResponseDto, toRoleUserResponse } from "./dto";
import { RoleUser } from "./role-user.model";
import { RoleUsersRepository } from "./role-users.repository";

export class RoleUsersService {
  public constructor(
    private readonly repository: RoleUsersRepository = new RoleUsersRepository(),
    private readonly usersRepository: UsersRepository = new UsersRepository(),
    private readonly rolesRepository: RolesRepository = new RolesRepository()
  ) {}

  public async getAll(): Promise<RoleUserResponseDto[]> {
    return (await this.repository.findAllActive()).map(toRoleUserResponse);
  }
  public async getOne(id: number): Promise<RoleUserResponseDto> {
    return toRoleUserResponse(await this.findOrFail(id));
  }
  public async assign(body: CreateRoleUserDto): Promise<RoleUserResponseDto> {
    if (!Number.isInteger(body.user_id) || body.user_id < 1 || !Number.isInteger(body.role_id) || body.role_id < 1) {
      throw new AppError(400, "user_id and role_id must be positive integers");
    }
    const user = await this.usersRepository.findById(body.user_id);
    if (!user || user.status !== "active") throw new AppError(404, "User not found or inactive");
    const role = await this.rolesRepository.findById(body.role_id);
    if (!role || role.status !== "active") throw new AppError(404, "Role not found or inactive");

    const existing = await this.repository.findByUserAndRole(body.user_id, body.role_id);
    if (existing?.status === "active") throw new AppError(409, "Role is already assigned to this user");
    if (existing) {
      await this.repository.update(existing, { status: "active" });
      return toRoleUserResponse(await this.reload(existing.id));
    }
    const created = await this.repository.create({ user_id: body.user_id, role_id: body.role_id, status: "active" });
    return toRoleUserResponse(await this.reload(created.id));
  }
  public async deactivate(id: number): Promise<RoleUserResponseDto> {
    const assignment = await this.findOrFail(id);
    await this.repository.update(assignment, { status: "inactive" });
    return toRoleUserResponse(await this.reload(assignment.id));
  }
  public async reactivate(id: number): Promise<RoleUserResponseDto> {
    const assignment = await this.findOrFail(id, false);
    if (assignment.status === "active") throw new AppError(409, "Assignment is already active");
    await this.assertAssignable(assignment.user_id, assignment.role_id);
    await this.repository.update(assignment, { status: "active" });
    return toRoleUserResponse(await this.reload(assignment.id));
  }

  private async findOrFail(id: number, onlyActive = true): Promise<RoleUser> {
    const assignment = await this.repository.findById(id);
    if (!assignment || (onlyActive && assignment.status !== "active")) throw new AppError(404, "Role assignment not found");
    return assignment;
  }
  private async reload(id: number): Promise<RoleUser> {
    const assignment = await this.repository.findById(id);
    if (!assignment) throw new AppError(404, "Role assignment not found");
    return assignment;
  }
  private async assertAssignable(userId: number, roleId: number): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    const role = await this.rolesRepository.findById(roleId);
    if (!user || user.status !== "active" || !role || role.status !== "active") {
      throw new AppError(404, "Active user and role are required");
    }
  }
}