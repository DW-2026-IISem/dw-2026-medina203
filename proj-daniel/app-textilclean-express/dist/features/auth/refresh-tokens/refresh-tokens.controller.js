"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokensController = void 0;
const auth_user_1 = require("../../../shared/auth/auth-user");
const base_controller_1 = require("../../../shared/http/base-controller");
const refresh_tokens_service_1 = require("./refresh-tokens.service");
class RefreshTokensController extends base_controller_1.BaseController {
    constructor(service = new refresh_tokens_service_1.RefreshTokensService()) {
        super();
        this.service = service;
    }
    async getAll(req, res) {
        await this.run(res, async () => {
            res.status(200).json({ sessions: await this.service.getAllMine((0, auth_user_1.requireAuthUser)(req).id) });
        });
    }
    async getOne(req, res) {
        await this.run(res, async () => {
            res.status(200).json({ session: await this.service.getMine((0, auth_user_1.requireAuthUser)(req).id, this.paramId(req)) });
        });
    }
    async revokeAll(req, res) {
        await this.run(res, async () => {
            const revoked = await this.service.revokeAllMine((0, auth_user_1.requireAuthUser)(req).id);
            res.status(200).json({ message: "All sessions revoked", revoked });
        });
    }
    async revokeOne(req, res) {
        await this.run(res, async () => {
            const session = await this.service.revokeMine((0, auth_user_1.requireAuthUser)(req).id, this.paramId(req));
            res.status(200).json({ message: "Session revoked", session });
        });
    }
    async purge(req, res) {
        await this.run(res, async () => {
            const purged = await this.service.purgeMine((0, auth_user_1.requireAuthUser)(req).id);
            res.status(200).json({ message: "Inactive sessions purged", purged });
        });
    }
}
exports.RefreshTokensController = RefreshTokensController;
//# sourceMappingURL=refresh-tokens.controller.js.map