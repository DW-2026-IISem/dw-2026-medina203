"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourcesRepository = void 0;
const resource_match_1 = require("../../../shared/auth/resource-match");
const resource_model_1 = require("./resource.model");
class ResourcesRepository {
    findAllActive() {
        return resource_model_1.Resource.findAll({ where: { status: "active" } });
    }
    findById(id, transaction) {
        return resource_model_1.Resource.findByPk(id, { transaction });
    }
    findByOperation(method, path) {
        return resource_model_1.Resource.findOne({ where: { method: method.trim().toUpperCase(), path: (0, resource_match_1.normalizePath)(path.trim()) } });
    }
    create(data) {
        return resource_model_1.Resource.create(data);
    }
    update(resource, data) {
        return resource.update(data);
    }
    async delete(resource) {
        await resource.destroy();
    }
}
exports.ResourcesRepository = ResourcesRepository;
//# sourceMappingURL=resources.repository.js.map