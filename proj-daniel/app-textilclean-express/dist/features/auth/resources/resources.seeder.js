"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedResources = seedResources;
const resource_match_1 = require("../../../shared/auth/resource-match");
const resource_catalog_1 = require("./resource-catalog");
const resource_model_1 = require("./resource.model");
async function seedResources() {
    let created = 0;
    for (const entry of resource_catalog_1.RESOURCE_CATALOG) {
        const method = entry.method.toUpperCase();
        const path = (0, resource_match_1.normalizePath)(entry.path);
        const [resource, wasCreated] = await resource_model_1.Resource.findOrCreate({
            where: { method, path },
            defaults: { method, path, description: entry.description, status: "active" },
        });
        if (wasCreated)
            created += 1;
        else if (resource.status !== "active" || resource.description !== entry.description) {
            await resource.update({ status: "active", description: entry.description });
        }
    }
    return created;
}
//# sourceMappingURL=resources.seeder.js.map