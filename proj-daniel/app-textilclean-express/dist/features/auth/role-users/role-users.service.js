"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleUsersService = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const roles_repository_1 = require("../roles/roles.repository");
const users_repository_1 = require("../users/users.repository");
const dto_1 = require("./dto");
const role_users_repository_1 = require("./role-users.repository");
class RoleUsersService {
    constructor(repository = new role_users_repository_1.RoleUsersRepository(), usersRepository = new users_repository_1.UsersRepository(), rolesRepository = new roles_repository_1.RolesRepository()) {
        this.repository = repository;
        this.usersRepository = usersRepository;
        this.rolesRepository = rolesRepository;
    }
    async getAll() {
        return (await this.repository.findAllActive()).map(dto_1.toRoleUserResponse);
    }
    async getOne(id) {
        return (0, dto_1.toRoleUserResponse)(await this.findOrFail(id));
    }
    async assign(body) {
        if (!Number.isInteger(body.user_id) || body.user_id < 1 || !Number.isInteger(body.role_id) || body.role_id < 1) {
            throw new app_error_1.AppError(400, "user_id and role_id must be positive integers");
        }
        const user = await this.usersRepository.findById(body.user_id);
        if (!user || user.status !== "active")
            throw new app_error_1.AppError(404, "User not found or inactive");
        const role = await this.rolesRepository.findById(body.role_id);
        if (!role || role.status !== "active")
            throw new app_error_1.AppError(404, "Role not found or inactive");
        const existing = await this.repository.findByUserAndRole(body.user_id, body.role_id);
        if (existing?.status === "active")
            throw new app_error_1.AppError(409, "Role is already assigned to this user");
        if (existing) {
            await this.repository.update(existing, { status: "active" });
            return (0, dto_1.toRoleUserResponse)(await this.reload(existing.id));
        }
        const created = await this.repository.create({ user_id: body.user_id, role_id: body.role_id, status: "active" });
        return (0, dto_1.toRoleUserResponse)(await this.reload(created.id));
    }
    async deactivate(id) {
        const assignment = await this.findOrFail(id);
        await this.repository.update(assignment, { status: "inactive" });
        return (0, dto_1.toRoleUserResponse)(await this.reload(assignment.id));
    }
    async reactivate(id) {
        const assignment = await this.findOrFail(id, false);
        if (assignment.status === "active")
            throw new app_error_1.AppError(409, "Assignment is already active");
        await this.assertAssignable(assignment.user_id, assignment.role_id);
        await this.repository.update(assignment, { status: "active" });
        return (0, dto_1.toRoleUserResponse)(await this.reload(assignment.id));
    }
    async findOrFail(id, onlyActive = true) {
        const assignment = await this.repository.findById(id);
        if (!assignment || (onlyActive && assignment.status !== "active"))
            throw new app_error_1.AppError(404, "Role assignment not found");
        return assignment;
    }
    async reload(id) {
        const assignment = await this.repository.findById(id);
        if (!assignment)
            throw new app_error_1.AppError(404, "Role assignment not found");
        return assignment;
    }
    async assertAssignable(userId, roleId) {
        const user = await this.usersRepository.findById(userId);
        const role = await this.rolesRepository.findById(roleId);
        if (!user || user.status !== "active" || !role || role.status !== "active") {
            throw new app_error_1.AppError(404, "Active user and role are required");
        }
    }
}
exports.RoleUsersService = RoleUsersService;
//# sourceMappingURL=role-users.service.js.map