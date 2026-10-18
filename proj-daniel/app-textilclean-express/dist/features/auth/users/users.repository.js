"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const sequelize_1 = require("sequelize");
const user_model_1 = require("./user.model");
class UsersRepository {
    async findAllActive() {
        return user_model_1.User.findAll({
            where: { status: "active" },
            attributes: UsersRepository.WITHOUT_PASSWORD,
        });
    }
    async findById(id) {
        return user_model_1.User.findByPk(id, { attributes: UsersRepository.WITHOUT_PASSWORD });
    }
    async findByIdWithPassword(id) {
        return user_model_1.User.findByPk(id);
    }
    async findByIdentifierWithPassword(identifier) {
        const normalized = identifier.trim().toLowerCase();
        return user_model_1.User.findOne({
            where: { [sequelize_1.Op.or]: [{ username: normalized }, { email: normalized }] },
        });
    }
    async findConflicts(username, email) {
        return user_model_1.User.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { username: username.trim().toLowerCase() },
                    { email: email.trim().toLowerCase() },
                ],
            },
            attributes: ["id", "username", "email"],
        });
    }
    async create(data) {
        return user_model_1.User.create(data);
    }
    async update(user, data) {
        return user.update(data);
    }
    async delete(user) {
        await user.destroy();
    }
}
exports.UsersRepository = UsersRepository;
UsersRepository.WITHOUT_PASSWORD = { exclude: ["password"] };
//# sourceMappingURL=users.repository.js.map