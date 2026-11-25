import { withTransaction } from "../../../shared/database/with-transaction";
import { AppError } from "../../../shared/errors/app-error";
import { ResourcesRepository } from "../resources/resources.repository";
import { RolesRepository } from "../roles/roles.repository";
import {
  CreateResourceRoleDto,
  EffectivePermissionDto,
  findDuplicateIds,
  ListResourceRolesDto,
  ReconcileResult,
  ResourceRoleResponseDto,
  toResourceRoleResponse,
} from "./dto";
import { ResourceRole } from "./resource-role.model";
import { ResourceRolesRepository } from "./resource-roles.repository";

export type { ReconcileResult } from "./dto";

/**
 * Operaciones que el rol ADMIN no puede perder desde el panel: sin ellas nadie
 * podría volver a abrir ni guardar la matriz (bloqueo administrativo).
 */
export const ADMIN_ROLE_NAME = "ADMIN";
export const ADMIN_PANEL_OPERATIONS: ReadonlyArray<{ method: string; path: string }> = [
  { method: "GET", path: "/api/roles" },
  { method: "GET", path: "/api/recursos" },
  { method: "GET", path: "/api/concesiones-rol" },
  { method: "POST", path: "/api/concesiones-rol" },
];

/**
 * Service de ResourceRoles: concede, retira y reactiva permisos de un rol.
 * `reconcileRole` deja la matriz de un rol EXACTAMENTE igual a una lista de
 * recursos (activa lo que falta y desactiva lo que sobra) en una transacción.
 */
export class ResourceRolesService {
  public constructor(
    private readonly repository: ResourceRolesRepository = new ResourceRolesRepository(),
    private readonly rolesRepository: RolesRepository = new RolesRepository(),
    private readonly resourcesRepository: ResourcesRepository = new ResourcesRepository()
  ) {}

  public async getAll(filters: ListResourceRolesDto = {}): Promise<ResourceRoleResponseDto[]> {
    return (await this.repository.findAllActiveFiltered(filters)).map(toResourceRoleResponse);
  }
  public async getOne(id: number): Promise<ResourceRoleResponseDto> {
    return toResourceRoleResponse(await this.findOrFail(id));
  }
  public findEffectiveForUser(userId: number): Promise<EffectivePermissionDto[]> {
    return this.repository.findEffectiveForUser(userId);
  }
  public async grant(body: CreateResourceRoleDto): Promise<ResourceRoleResponseDto> {
    if (!Number.isInteger(body.role_id) || body.role_id < 1 || !Number.isInteger(body.resource_id) || body.resource_id < 1) {
      throw new AppError(400, "role_id and resource_id must be positive integers");
    }
    await this.assertActivePair(body.role_id, body.resource_id);
    const existing = await this.repository.findByRoleAndResource(body.role_id, body.resource_id);
    if (existing?.status === "active") throw new AppError(409, "Role already has this resource granted");
    if (existing) {
      await this.repository.update(existing, { status: "active" });
      return toResourceRoleResponse(await this.reload(existing.id));
    }
    const created = await this.repository.create({ role_id: body.role_id, resource_id: body.resource_id, status: "active" });
    return toResourceRoleResponse(await this.reload(created.id));
  }
  public async deactivate(id: number): Promise<ResourceRoleResponseDto> {
    const grant = await this.findOrFail(id);
    await this.repository.update(grant, { status: "inactive" });
    return toResourceRoleResponse(await this.reload(grant.id));
  }
  public async reactivate(id: number): Promise<ResourceRoleResponseDto> {
    const grant = await this.findOrFail(id, false);
    if (grant.status === "active") throw new AppError(409, "Grant is already active");
    await this.assertActivePair(grant.role_id, grant.resource_id);
    await this.repository.update(grant, { status: "active" });
    return toResourceRoleResponse(await this.reload(grant.id));
  }

  /**
   * Deja los permisos de un rol EXACTAMENTE iguales a `resourceIds`:
   *   - enviado y sin concesión → se crea activa
   *   - enviado e inactivo      → se reactiva
   *   - enviado y activo        → sin cambios (idempotente)
   *   - activo y no enviado     → se revoca (`status = inactive`, no se borra)
   *
   * Todo ocurre en UNA transacción: si algo falla, no queda una matriz a medias.
   * Errores: 404 rol inexistente/inactivo · 400 ids inválidos, duplicados,
   * inexistentes o inactivos · 409 ADMIN perdería el acceso al panel.
   */
  public async reconcileRole(roleId: number, resourceIds: number[]): Promise<ReconcileResult> {
    if (!Number.isInteger(roleId) || roleId < 1) throw new AppError(400, "role_id must be a positive integer");
    if (!Array.isArray(resourceIds) || resourceIds.some((id) => !Number.isInteger(id) || id < 1)) {
      throw new AppError(400, "resource_ids must contain only positive integers");
    }
    const duplicates = findDuplicateIds(resourceIds);
    if (duplicates.length > 0) throw new AppError(400, `resource_ids has duplicated ids: ${duplicates.join(", ")}`);

    const role = await this.rolesRepository.findById(roleId);
    if (!role || role.status !== "active") throw new AppError(404, "Active role not found");

    const desiredIds = [...resourceIds].sort((left, right) => left - right);
    const desired = new Set(desiredIds);

    return withTransaction(async (transaction) => {
      const activeResources = await this.repository.findActiveResourcesByIds(desiredIds, transaction);
      if (activeResources.length !== desiredIds.length) {
        const found = new Set(activeResources.map((resource) => resource.id));
        const missing = desiredIds.filter((id) => !found.has(id));
        throw new AppError(400, `Resources not found or inactive: ${missing.join(", ")}`);
      }
      if (role.name === ADMIN_ROLE_NAME) await this.assertAdminKeepsPanel(desired);

      const existing = await this.repository.findAllByRole(roleId, transaction);
      const byResourceId = new Map(existing.map((grant) => [grant.resource_id, grant]));
      let activated = 0;
      let deactivated = 0;

      for (const resourceId of desiredIds) {
        const current = byResourceId.get(resourceId);
        if (!current) {
          await this.repository.create({ role_id: roleId, resource_id: resourceId, status: "active" }, transaction);
          activated += 1;
        } else if (current.status !== "active") {
          await this.repository.update(current, { status: "active" }, transaction);
          activated += 1;
        }
      }
      for (const current of existing) {
        if (!desired.has(current.resource_id) && current.status === "active") {
          await this.repository.update(current, { status: "inactive" }, transaction);
          deactivated += 1;
        }
      }
      return { role_id: roleId, activated, deactivated, total_active: desiredIds.length };
    });
  }

  private async assertAdminKeepsPanel(desired: Set<number>): Promise<void> {
    const missing: string[] = [];
    for (const operation of ADMIN_PANEL_OPERATIONS) {
      const resource = await this.resourcesRepository.findByOperation(operation.method, operation.path);
      if (resource?.status === "active" && !desired.has(resource.id)) missing.push(`${operation.method} ${operation.path}`);
    }
    if (missing.length > 0) {
      throw new AppError(409, `ADMIN must keep access to the permissions panel: ${missing.join(", ")}`);
    }
  }

  private async findOrFail(id: number, onlyActive = true): Promise<ResourceRole> {
    const grant = await this.repository.findById(id);
    if (!grant || (onlyActive && grant.status !== "active")) throw new AppError(404, "Grant not found");
    return grant;
  }
  private async reload(id: number): Promise<ResourceRole> {
    const grant = await this.repository.findById(id);
    if (!grant) throw new AppError(404, "Grant not found");
    return grant;
  }
  private async assertActivePair(roleId: number, resourceId: number): Promise<void> {
    const role = await this.rolesRepository.findById(roleId);
    const resource = await this.resourcesRepository.findById(resourceId);
    if (!role || role.status !== "active") throw new AppError(404, "Role not found or inactive");
    if (!resource || resource.status !== "active") throw new AppError(404, "Resource not found or inactive");
  }
}