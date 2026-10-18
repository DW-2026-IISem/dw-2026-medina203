"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedResourceRoles = seedResourceRoles;
const resource_catalog_1 = require("../resources/resource-catalog");
const resource_model_1 = require("../resources/resource.model");
const role_model_1 = require("../roles/role.model");
const resource_roles_service_1 = require("./resource-roles.service");
async function seedResourceRoles() {
    const resourceByOperation = new Map();
    for (const resource of await resource_model_1.Resource.findAll({ where: { status: "active" } })) {
        resourceByOperation.set(`${resource.method} ${resource.path}`, resource);
    }
    const reconcile = new resource_roles_service_1.ResourceRolesService();
    let changes = 0;
    for (const roleName of ["ADMIN", "SELLER"]) {
        const role = await role_model_1.Role.findOne({ where: { name: roleName, status: "active" } });
        if (!role)
            continue;
        const catalog = roleName === "ADMIN" ? resource_catalog_1.RESOURCE_CATALOG : resource_catalog_1.SELLER_RESOURCES;
        const resourceIds = catalog.map((entry) => {
            const resource = resourceByOperation.get(`${entry.method} ${entry.path}`);
            if (!resource)
                throw new Error(`Missing seeded resource ${entry.method} ${entry.path}`);
            return resource.id;
        });
        const result = await reconcile.reconcileRole(role.id, resourceIds);
        changes += result.activated + result.deactivated;
    }
    return changes;
}
//# sourceMappingURL=resource-roles.seeder.js.map