import { AppError } from "../../../shared/errors/app-error";
import { CreateRoleDto, PatchRoleDto, RoleResponseDto, toRoleResponse, UpdateRoleDto } from "./dto";
import { Role } from "./role.model";
import { RolesRepository } from "./roles.repository";

export class RolesService {
  public constructor(private readonly repository: RolesRepository = new RolesRepository()) {}

  public async getAll(): Promise<RoleResponseDto[]> {
    return (await this.repository.findAllActive()).map(toRoleResponse);
  }

  public async getOne(id: number): Promise<RoleResponseDto> {
    return toRoleResponse(await this.findOrFail(id));
  }

  public async create(body: CreateRoleDto): Promise<RoleResponseDto> {
    const name = this.validateName(body.name);
    await this.assertNameAvailable(name);
    return toRoleResponse(await this.repository.create({
      name,
      description: body.description ?? null,
      status: body.status ?? "active",
    }));
  }

  public async updatePut(id: number, body: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.findOrFail(id);
    const name = this.validateName(body.name);
    await this.assertNameAvailable(name, id);
    await this.repository.update(role, { name, description: body.description ?? null });
    return toRoleResponse(role);
  }

  public async updatePatch(id: number, body: PatchRoleDto): Promise<RoleResponseDto> {
    const role = await this.findOrFail(id);
    const update: Partial<Pick<Role, "name" | "description">> = {};
    if (body.name !== undefined) {
      update.name = this.validateName(body.name);
      await this.assertNameAvailable(update.name, id);
    }
    if (body.description !== undefined) update.description = body.description;
    await this.repository.update(role, update);
    return toRoleResponse(role);
  }

  public async deletePhysical(id: number): Promise<void> {
    await this.repository.delete(await this.findOrFail(id, false));
  }

  public async deleteLogical(id: number): Promise<RoleResponseDto> {
    const role = await this.findOrFail(id);
    await this.repository.update(role, { status: "inactive" });
    return toRoleResponse(role);
  }

  private async findOrFail(id: number, onlyActive = true): Promise<Role> {
    const role = await this.repository.findById(id);
    if (!role || (onlyActive && role.status !== "active")) throw new AppError(404, "Role not found");
    return role;
  }

  private validateName(value: string): string {
    if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > 80) {
      throw new AppError(400, "name is required and must not exceed 80 characters");
    }
    return value.trim().toUpperCase();
  }

  private async assertNameAvailable(name: string, excludeId?: number): Promise<void> {
    const existing = await this.repository.findByName(name);
    if (existing && existing.id !== excludeId) throw new AppError(409, "Role name already in use");
  }
}