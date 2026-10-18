"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const dto_1 = require("./dto");
const roles_repository_1 = require("./roles.repository");
class RolesService {
    constructor(repository = new roles_repository_1.RolesRepository()) {
        this.repository = repository;
    }
    async getAll() {
        return (await this.repository.findAllActive()).map(dto_1.toRoleResponse);
    }
    async getOne(id) {
        return (0, dto_1.toRoleResponse)(await this.findOrFail(id));
    }
    async create(body) {
        const name = this.validateName(body.name);
        await this.assertNameAvailable(name);
        return (0, dto_1.toRoleResponse)(await this.repository.create({
            name,
            description: body.description ?? null,
            status: body.status ?? "active",
        }));
    }
    async updatePut(id, body) {
        const role = await this.findOrFail(id);
        const name = this.validateName(body.name);
        await this.assertNameAvailable(name, id);
        await this.repository.update(role, { name, description: body.description ?? null });
        return (0, dto_1.toRoleResponse)(role);
    }
    async updatePatch(id, body) {
        const role = await this.findOrFail(id);
        const update = {};
        if (body.name !== undefined) {
            update.name = this.validateName(body.name);
            await this.assertNameAvailable(update.name, id);
        }
        if (body.description !== undefined)
            update.description = body.description;
        await this.repository.update(role, update);
        return (0, dto_1.toRoleResponse)(role);
    }
    async deletePhysical(id) {
        await this.repository.delete(await this.findOrFail(id, false));
    }
    async deleteLogical(id) {
        const role = await this.findOrFail(id);
        await this.repository.update(role, { status: "inactive" });
        return (0, dto_1.toRoleResponse)(role);
    }
    async findOrFail(id, onlyActive = true) {
        const role = await this.repository.findById(id);
        if (!role || (onlyActive && role.status !== "active"))
            throw new app_error_1.AppError(404, "Role not found");
        return role;
    }
    validateName(value) {
        if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > 80) {
            throw new app_error_1.AppError(400, "name is required and must not exceed 80 characters");
        }
        return value.trim().toUpperCase();
    }
    async assertNameAvailable(name, excludeId) {
        const existing = await this.repository.findByName(name);
        if (existing && existing.id !== excludeId)
            throw new app_error_1.AppError(409, "Role name already in use");
    }
}
exports.RolesService = RolesService;
//# sourceMappingURL=roles.service.js.map