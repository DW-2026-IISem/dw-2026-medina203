"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokensService = void 0;
const node_crypto_1 = require("node:crypto");
const password_1 = require("../../../shared/auth/password");
const with_transaction_1 = require("../../../shared/database/with-transaction");
const app_error_1 = require("../../../shared/errors/app-error");
const dto_1 = require("./dto");
const refresh_tokens_repository_1 = require("./refresh-tokens.repository");
const REFRESH_TTL_DAYS = Number(process.env.JWT_REFRESH_TTL_DAYS ?? 30);
class RefreshTokensService {
    constructor(repository = new refresh_tokens_repository_1.RefreshTokensRepository()) {
        this.repository = repository;
    }
    async getAllMine(userId) {
        return (await this.repository.findAllByUser(userId)).map(dto_1.toRefreshTokenResponse);
    }
    async getMine(userId, id) {
        return (0, dto_1.toRefreshTokenResponse)(await this.findMineOrFail(userId, id));
    }
    async revokeMine(userId, id) {
        const token = await this.findMineOrFail(userId, id);
        if (token.status === "active")
            await this.repository.update(token, { status: "inactive" });
        return (0, dto_1.toRefreshTokenResponse)(token);
    }
    revokeAllMine(userId) { return this.repository.revokeAllByUser(userId); }
    purgeMine(userId) { return this.repository.purgeInactiveByUser(userId); }
    countActiveMine(userId) { return this.repository.countActiveByUser(userId); }
    async issue(userId, deviceInfo, transaction) {
        const rawToken = (0, password_1.generateOpaqueToken)();
        const familyId = (0, node_crypto_1.randomUUID)();
        const expiresAt = expiryFromNow();
        await this.repository.create({
            user_id: userId, token_hash: (0, password_1.sha256Hex)(rawToken), family_id: familyId,
            device_info: deviceInfo, expires_at: expiresAt, status: "active",
        }, transaction);
        return { rawToken, familyId, expiresAt };
    }
    async rotate(rawToken, deviceInfo) {
        if (!rawToken)
            return { kind: "invalid" };
        return (0, with_transaction_1.withTransaction)(async (transaction) => {
            const current = await this.repository.findByHash((0, password_1.sha256Hex)(rawToken), transaction, true);
            if (!current)
                return { kind: "invalid" };
            if (current.status !== "active") {
                const revoked = await this.repository.revokeFamily(current.family_id, transaction);
                return { kind: "reuse", familyId: current.family_id, revoked };
            }
            if (new Date(current.expires_at).getTime() <= Date.now()) {
                await this.repository.update(current, { status: "inactive" }, transaction);
                return { kind: "expired" };
            }
            await this.repository.update(current, { status: "inactive" }, transaction);
            const nextToken = (0, password_1.generateOpaqueToken)();
            const expiresAt = expiryFromNow();
            await this.repository.create({
                user_id: current.user_id,
                token_hash: (0, password_1.sha256Hex)(nextToken),
                family_id: current.family_id,
                device_info: deviceInfo ?? current.device_info,
                expires_at: expiresAt,
                status: "active",
            }, transaction);
            return { kind: "rotated", userId: current.user_id, rawToken: nextToken, familyId: current.family_id, expiresAt };
        });
    }
    async revokeByToken(rawToken) {
        if (!rawToken)
            return false;
        const token = await this.repository.findByHash((0, password_1.sha256Hex)(rawToken));
        if (!token)
            return false;
        if (token.status === "active")
            await this.repository.update(token, { status: "inactive" });
        return true;
    }
    async findMineOrFail(userId, id) {
        const token = await this.repository.findById(id);
        if (!token || token.user_id !== userId)
            throw new app_error_1.AppError(404, "Session not found");
        return token;
    }
}
exports.RefreshTokensService = RefreshTokensService;
function expiryFromNow() {
    return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}
//# sourceMappingURL=refresh-tokens.service.js.map