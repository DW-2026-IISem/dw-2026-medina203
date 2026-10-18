"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEED_ROLE_USERS = void 0;
exports.seedRoleUsers = seedRoleUsers;
const role_model_1 = require("../roles/role.model");
const user_model_1 = require("../users/user.model");
const role_user_model_1 = require("./role-user.model");
exports.SEED_ROLE_USERS = [
    { username: "admin", roleName: "ADMIN" },
    { username: "seller", roleName: "SELLER" },
];
async function seedRoleUsers() {
    let created = 0;
    for (const item of exports.SEED_ROLE_USERS) {
        const user = await user_model_1.User.findOne({ where: { username: item.username } });
        const role = await role_model_1.Role.findOne({ where: { name: item.roleName } });
        if (!user || !role || user.status !== "active" || role.status !== "active")
            continue;
        const [assignment, wasCreated] = await role_user_model_1.RoleUser.findOrCreate({
            where: { user_id: user.id, role_id: role.id },
            defaults: { user_id: user.id, role_id: role.id, status: "active" },
        });
        if (wasCreated)
            created += 1;
        else if (assignment.status !== "active")
            await assignment.update({ status: "active" });
    }
    return created;
}
//# sourceMappingURL=role-users.seeder.js.map