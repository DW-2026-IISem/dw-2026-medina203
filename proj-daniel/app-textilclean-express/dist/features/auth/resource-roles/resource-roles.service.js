"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceRolesService = void 0;
const with_transaction_1 = require("../../../shared/database/with-transaction");
const app_error_1 = require("../../../shared/errors/app-error");
const resources_repository_1 = require("../resources/resources.repository");
const roles_repository_1 = require("../roles/roles.repository");
const dto_1 = require("./dto");
const resource_roles_repository_1 = require("./resource-roles.repository");
class ResourceRolesService {
    constructor(repository = new resource_roles_repository_1.ResourceRolesRepository(), rolesRepository = new roles_repository_1.RolesRepository(), resourcesRepository = new resources_repository_1.ResourcesRepository()) {
        this.repository = repository;
        this.rolesRepository = rolesRepository;
        this.resourcesRepository = resourcesRepository;
    }
    async getAll(filters = {}) {
        return (await this.repository.findAllActiveFiltered(filters)).map(dto_1.toResourceRoleResponse);
    }
    async getOne(id) {
        return (0, dto_1.toResourceRoleResponse)(await this.findOrFail(id));
    }
    findEffectiveForUser(userId) {
        return this.repository.findEffectiveForUser(userId);
    }
    async grant(body) {
        if (!Number.isInteger(body.role_id) || body.role_id < 1 || !Number.isInteger(body.resource_id) || body.resource_id < 1) {
            throw new app_error_1.AppError(400, "role_id and resource_id must be positive integers");
        }
        await this.assertActivePair(body.role_id, body.resource_id);
        const existing = await this.repository.findByRoleAndResource(body.role_id, body.resource_id);
        if (existing?.status === "active")
            throw new app_error_1.AppError(409, "Role already has this resource granted");
        if (existing) {
            await this.repository.update(existing, { status: "active" });
            return (0, dto_1.toResourceRoleResponse)(await this.reload(existing.id));
        }
        const created = await this.repository.create({ role_id: body.role_id, resource_id: body.resource_id, status: "active" });
        return (0, dto_1.toResourceRoleResponse)(await this.reload(created.id));
    }
    async deactivate(id) {
        const grant = await this.findOrFail(id);
        await this.repository.update(grant, { status: "inactive" });
        return (0, dto_1.toResourceRoleResponse)(await this.reload(grant.id));
    }
    async reactivate(id) {
        const grant = await this.findOrFail(id, false);
        if (grant.status === "active")
            throw new app_error_1.AppError(409, "Grant is already active");
        await this.assertActivePair(grant.role_id, grant.resource_id);
        await this.repository.update(grant, { status: "active" });
        return (0, dto_1.toResourceRoleResponse)(await this.reload(grant.id));
    }
    async reconcileRole(roleId, resourceIds) {
        const role = await this.rolesRepository.findById(roleId);
        if (!role || role.status !== "active")
            throw new app_error_1.AppError(404, "Active role not found");
        if (!Array.isArray(resourceIds) || resourceIds.some((id) => !Number.isInteger(id) || id < 1)) {
            throw new app_error_1.AppError(400, "resourceIds must contain positive integers");
        }
        const desiredIds = [...new Set(resourceIds)].sort((left, right) => left - right);
        const activeResources = await this.repository.findActiveResourcesByIds(desiredIds);
        if (activeResources.length !== desiredIds.length)
            throw new app_error_1.AppError(404, "One or more active resources were not found");
        return (0, with_transaction_1.withTransaction)(async (transaction) => {
            const existing = await this.repository.findAllByRole(roleId, transaction);
            const byResourceId = new Map(existing.map((grant) => [grant.resource_id, grant]));
            const desired = new Set(desiredIds);
            let activated = 0;
            let deactivated = 0;
            for (const resourceId of desiredIds) {
                const current = byResourceId.get(resourceId);
                if (!current) {
                    await this.repository.create({ role_id: roleId, resource_id: resourceId, status: "active" }, transaction);
                    activated += 1;
                }
                else if (current.status !== "active") {
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
    async findOrFail(id, onlyActive = true) {
        const grant = await this.repository.findById(id);
        if (!grant || (onlyActive && grant.status !== "active"))
            throw new app_error_1.AppError(404, "Grant not found");
        return grant;
    }
    async reload(id) {
        const grant = await this.repository.findById(id);
        if (!grant)
            throw new app_error_1.AppError(404, "Grant not found");
        return grant;
    }
    async assertActivePair(roleId, resourceId) {
        const role = await this.rolesRepository.findById(roleId);
        const resource = await this.resourcesRepository.findById(resourceId);
        if (!role || role.status !== "active")
            throw new app_error_1.AppError(404, "Role not found or inactive");
        if (!resource || resource.status !== "active")
            throw new app_error_1.AppError(404, "Resource not found or inactive");
    }
}
exports.ResourceRolesService = ResourceRolesService;
//# sourceMappingURL=resource-roles.service.js.map