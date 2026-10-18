"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const password_1 = require("../../../shared/auth/password");
const app_error_1 = require("../../../shared/errors/app-error");
const dto_1 = require("./dto");
const users_repository_1 = require("./users.repository");
const resource_roles_service_1 = require("../resource-roles/resource-roles.service");
class UsersService {
    constructor(repository = new users_repository_1.UsersRepository(), resourceRolesService = new resource_roles_service_1.ResourceRolesService()) {
        this.repository = repository;
        this.resourceRolesService = resourceRolesService;
    }
    async getAll() {
        return (await this.repository.findAllActive()).map(dto_1.toUserResponse);
    }
    async getOne(id) {
        return (0, dto_1.toUserResponse)(await this.findOrFail(id));
    }
    async getEffectivePermissions(id) {
        await this.findOrFail(id);
        return this.resourceRolesService.findEffectiveForUser(id);
    }
    async create(body) {
        this.validateCredentials(body.username, body.email, body.password);
        await this.assertUnique(body.username, body.email);
        const user = await this.repository.create({
            username: body.username.trim().toLowerCase(),
            email: body.email.trim().toLowerCase(),
            password: body.password,
            avatar: body.avatar ?? null,
            status: body.status ?? "active",
        });
        return (0, dto_1.toUserResponse)(user);
    }
    async updatePut(id, body) {
        const user = await this.findOrFail(id);
        this.validateIdentity(body.username, body.email);
        await this.assertUnique(body.username, body.email, id);
        await this.repository.update(user, {
            username: body.username.trim().toLowerCase(),
            email: body.email.trim().toLowerCase(),
            avatar: body.avatar ?? null,
        });
        return (0, dto_1.toUserResponse)(user);
    }
    async updatePatch(id, body) {
        const user = await this.findOrFail(id);
        const username = body.username ?? user.username;
        const email = body.email ?? user.email;
        this.validateIdentity(username, email);
        await this.assertUnique(username, email, id);
        const update = {};
        if (body.username !== undefined)
            update.username = username.trim().toLowerCase();
        if (body.email !== undefined)
            update.email = email.trim().toLowerCase();
        if (body.avatar !== undefined)
            update.avatar = body.avatar;
        await this.repository.update(user, update);
        return (0, dto_1.toUserResponse)(user);
    }
    async changePassword(id, body) {
        if (typeof body.current_password !== "string" || typeof body.new_password !== "string" ||
            body.new_password.length < 8) {
            throw new app_error_1.AppError(400, "current_password and new_password (min 8 characters) are required");
        }
        const user = await this.repository.findByIdWithPassword(id);
        if (!user || user.status !== "active")
            throw new app_error_1.AppError(404, "User not found");
        if (!(await (0, password_1.comparePassword)(body.current_password, user.password))) {
            throw new app_error_1.AppError(400, "Current password is incorrect");
        }
        await this.repository.update(user, { password: body.new_password });
    }
    async deletePhysical(id) {
        await this.repository.delete(await this.findOrFail(id, false));
    }
    async deleteLogical(id) {
        const user = await this.findOrFail(id);
        await this.repository.update(user, { status: "inactive" });
        return (0, dto_1.toUserResponse)(user);
    }
    async findOrFail(id, onlyActive = true) {
        const user = await this.repository.findById(id);
        if (!user || (onlyActive && user.status !== "active"))
            throw new app_error_1.AppError(404, "User not found");
        return user;
    }
    validateCredentials(username, email, password) {
        this.validateIdentity(username, email);
        if (typeof password !== "string" || password.length < 8) {
            throw new app_error_1.AppError(400, "password must contain at least 8 characters");
        }
    }
    validateIdentity(username, email) {
        if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 80) {
            throw new app_error_1.AppError(400, "username must contain between 3 and 80 characters");
        }
        if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            throw new app_error_1.AppError(400, "email must be valid");
        }
    }
    async assertUnique(username, email, excludeId) {
        const conflicts = await this.repository.findConflicts(username, email);
        for (const candidate of conflicts) {
            if (candidate.id === excludeId)
                continue;
            if (candidate.username === username.trim().toLowerCase()) {
                throw new app_error_1.AppError(409, "Username already in use");
            }
            if (candidate.email === email.trim().toLowerCase()) {
                throw new app_error_1.AppError(409, "Email already in use");
            }
        }
    }
}
exports.UsersService = UsersService;
//# sourceMappingURL=users.service.js.map