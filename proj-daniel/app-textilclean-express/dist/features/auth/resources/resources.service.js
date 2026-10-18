"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourcesService = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const resource_match_1 = require("../../../shared/auth/resource-match");
const dto_1 = require("./dto");
const resources_repository_1 = require("./resources.repository");
class ResourcesService {
    constructor(repository = new resources_repository_1.ResourcesRepository()) {
        this.repository = repository;
    }
    async getAll() {
        return (await this.repository.findAllActive()).map(dto_1.toResourceResponse);
    }
    async getOne(id) {
        return (0, dto_1.toResourceResponse)(await this.findOrFail(id));
    }
    async create(body) {
        const method = this.validateMethod(body.method);
        const path = this.validatePath(body.path);
        await this.assertOperationAvailable(method, path);
        const resource = await this.repository.create({ method, path, description: body.description ?? null, status: body.status ?? "active" });
        return (0, dto_1.toResourceResponse)(resource);
    }
    async updatePut(id, body) {
        const resource = await this.findOrFail(id);
        const method = this.validateMethod(body.method);
        const path = this.validatePath(body.path);
        await this.assertOperationAvailable(method, path, id);
        await this.repository.update(resource, { method, path, description: body.description ?? null });
        return (0, dto_1.toResourceResponse)(resource);
    }
    async updatePatch(id, body) {
        const resource = await this.findOrFail(id);
        const update = {};
        const method = body.method === undefined ? resource.method : this.validateMethod(body.method);
        const path = body.path === undefined ? resource.path : this.validatePath(body.path);
        await this.assertOperationAvailable(method, path, id);
        if (body.method !== undefined)
            update.method = method;
        if (body.path !== undefined)
            update.path = path;
        if (body.description !== undefined)
            update.description = body.description;
        await this.repository.update(resource, update);
        return (0, dto_1.toResourceResponse)(resource);
    }
    async deletePhysical(id) {
        await this.repository.delete(await this.findOrFail(id, false));
    }
    async deleteLogical(id) {
        const resource = await this.findOrFail(id);
        await this.repository.update(resource, { status: "inactive" });
        return (0, dto_1.toResourceResponse)(resource);
    }
    async findOrFail(id, onlyActive = true) {
        const resource = await this.repository.findById(id);
        if (!resource || (onlyActive && resource.status !== "active"))
            throw new app_error_1.AppError(404, "Resource not found");
        return resource;
    }
    validateMethod(value) {
        const method = typeof value === "string" ? value.trim().toUpperCase() : "";
        if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method))
            throw new app_error_1.AppError(400, "Invalid resource method");
        return method;
    }
    validatePath(value) {
        if (typeof value !== "string" || !value.trim().startsWith("/"))
            throw new app_error_1.AppError(400, "path must start with /");
        return (0, resource_match_1.normalizePath)(value.trim());
    }
    async assertOperationAvailable(method, path, excludeId) {
        const existing = await this.repository.findByOperation(method, path);
        if (existing && existing.id !== excludeId)
            throw new app_error_1.AppError(409, `Resource ${method} ${path} already exists`);
    }
}
exports.ResourcesService = ResourcesService;
//# sourceMappingURL=resources.service.js.map