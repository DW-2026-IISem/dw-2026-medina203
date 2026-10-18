"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesRepository = void 0;
const role_model_1 = require("./role.model");
class RolesRepository {
    findAllActive() {
        return role_model_1.Role.findAll({ where: { status: "active" } });
    }
    findById(id) {
        return role_model_1.Role.findByPk(id);
    }
    findByName(name) {
        return role_model_1.Role.findOne({ where: { name: name.trim().toUpperCase() } });
    }
    create(data) {
        return role_model_1.Role.create(data);
    }
    update(role, data) {
        return role.update(data);
    }
    async delete(role) {
        await role.destroy();
    }
}
exports.RolesRepository = RolesRepository;
//# sourceMappingURL=roles.repository.js.map