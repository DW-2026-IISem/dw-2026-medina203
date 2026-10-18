"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokensRepository = void 0;
const sequelize_1 = require("sequelize");
const refresh_token_model_1 = require("./refresh-token.model");
class RefreshTokensRepository {
    findByHash(tokenHash, transaction, lock = false) {
        return refresh_token_model_1.RefreshToken.findOne({
            where: { token_hash: tokenHash },
            transaction,
            ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}),
        });
    }
    findAllByUser(userId, onlyActive = true) {
        const where = { user_id: userId };
        if (onlyActive)
            where.status = "active";
        return refresh_token_model_1.RefreshToken.findAll({ where, order: [["createdAt", "DESC"]] });
    }
    findById(id) {
        return refresh_token_model_1.RefreshToken.findByPk(id);
    }
    create(data, transaction) {
        return refresh_token_model_1.RefreshToken.create(data, { transaction });
    }
    update(token, data, transaction) {
        return token.update(data, { transaction });
    }
    async revokeFamily(familyId, transaction) {
        const [updated] = await refresh_token_model_1.RefreshToken.update({ status: "inactive" }, { where: { family_id: familyId, status: "active" }, transaction });
        return updated;
    }
    async revokeAllByUser(userId) {
        const [updated] = await refresh_token_model_1.RefreshToken.update({ status: "inactive" }, { where: { user_id: userId, status: "active" } });
        return updated;
    }
    purgeInactiveByUser(userId) {
        return refresh_token_model_1.RefreshToken.destroy({
            where: { user_id: userId, [sequelize_1.Op.or]: [{ status: "inactive" }, { expires_at: { [sequelize_1.Op.lt]: new Date() } }] },
        });
    }
    countActiveByUser(userId) {
        return refresh_token_model_1.RefreshToken.count({ where: { user_id: userId, status: "active" } });
    }
}
exports.RefreshTokensRepository = RefreshTokensRepository;
//# sourceMappingURL=refresh-tokens.repository.js.map