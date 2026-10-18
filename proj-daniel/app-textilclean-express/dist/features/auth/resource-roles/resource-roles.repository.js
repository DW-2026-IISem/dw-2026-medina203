"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceRolesRepository = void 0;
const sequelize_1 = require("sequelize");
const resource_model_1 = require("../resources/resource.model");
const role_model_1 = require("../roles/role.model");
const role_user_model_1 = require("../role-users/role-user.model");
const resource_role_model_1 = require("./resource-role.model");
const SUMMARIES = [
    { model: role_model_1.Role, as: "role", attributes: ["id", "name"] },
    { model: resource_model_1.Resource, as: "resource", attributes: ["id", "method", "path", "description"] },
];
class ResourceRolesRepository {
    findAllActiveFiltered(filters) {
        const where = { status: "active" };
        if (filters.role_id !== undefined)
            where.role_id = filters.role_id;
        if (filters.resource_id !== undefined)
            where.resource_id = filters.resource_id;
        return resource_role_model_1.ResourceRole.findAll({ where, include: SUMMARIES, order: [["id", "ASC"]] });
    }
    findById(id, transaction) {
        return resource_role_model_1.ResourceRole.findByPk(id, { include: SUMMARIES, transaction });
    }
    findByRoleAndResource(roleId, resourceId) {
        return resource_role_model_1.ResourceRole.findOne({ where: { role_id: roleId, resource_id: resourceId } });
    }
    findAllByRole(roleId, transaction) {
        return resource_role_model_1.ResourceRole.findAll({ where: { role_id: roleId }, transaction, order: [["resource_id", "ASC"]] });
    }
    create(data, transaction) {
        return resource_role_model_1.ResourceRole.create(data, { transaction });
    }
    update(resourceRole, data, transaction) {
        return resourceRole.update(data, { transaction });
    }
    async countActiveByRole(roleId) {
        return resource_role_model_1.ResourceRole.count({ where: { role_id: roleId, status: "active" } });
    }
    async findEffectiveForUser(userId) {
        const rows = await resource_role_model_1.ResourceRole.findAll({
            where: { status: "active" },
            include: [
                {
                    model: role_model_1.Role, as: "role", required: true, attributes: ["id", "name"],
                    where: { status: "active" },
                    include: [{
                            model: role_user_model_1.RoleUser, as: "role_users", required: true, attributes: [],
                            where: { status: "active", user_id: userId },
                        }],
                },
                {
                    model: resource_model_1.Resource, as: "resource", required: true,
                    attributes: ["id", "method", "path", "description"], where: { status: "active" },
                },
            ],
            order: [["id", "ASC"]],
        });
        return rows.map((row) => {
            const plain = row.toJSON();
            return {
                resource_id: plain.resource.id,
                method: plain.resource.method,
                path: plain.resource.path,
                description: plain.resource.description,
                role_id: plain.role.id,
                role_name: plain.role.name,
            };
        });
    }
    async findActiveResourcesByIds(ids, transaction) {
        if (ids.length === 0)
            return [];
        return resource_model_1.Resource.findAll({
            where: { id: { [sequelize_1.Op.in]: ids }, status: "active" },
            attributes: ["id"],
            transaction,
            order: [["id", "ASC"]],
        });
    }
}
exports.ResourceRolesRepository = ResourceRolesRepository;
//# sourceMappingURL=resource-roles.repository.js.map