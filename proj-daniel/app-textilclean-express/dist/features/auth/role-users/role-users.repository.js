"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleUsersRepository = void 0;
const role_model_1 = require("../roles/role.model");
const user_model_1 = require("../users/user.model");
const role_user_model_1 = require("./role-user.model");
const SUMMARIES = [
    { model: user_model_1.User, as: "user", attributes: ["id", "username", "email"] },
    { model: role_model_1.Role, as: "role", attributes: ["id", "name"] },
];
class RoleUsersRepository {
    findAllActive() {
        return role_user_model_1.RoleUser.findAll({ where: { status: "active" }, include: SUMMARIES });
    }
    findById(id, transaction) {
        return role_user_model_1.RoleUser.findByPk(id, { include: SUMMARIES, transaction });
    }
    findByUserAndRole(userId, roleId) {
        return role_user_model_1.RoleUser.findOne({ where: { user_id: userId, role_id: roleId } });
    }
    create(data) {
        return role_user_model_1.RoleUser.create(data);
    }
    update(roleUser, data) {
        return roleUser.update(data);
    }
}
exports.RoleUsersRepository = RoleUsersRepository;
//# sourceMappingURL=role-users.repository.js.map