"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const auth_user_1 = require("../../../shared/auth/auth-user");
const base_controller_1 = require("../../../shared/http/base-controller");
const session_service_1 = require("./session.service");
class SessionController extends base_controller_1.BaseController {
    constructor(service = new session_service_1.SessionService()) {
        super();
        this.service = service;
    }
    async login(req, res) {
        await this.run(res, async () => {
            res.status(200).json(await this.service.login(req.body, deviceInfo(req)));
        });
    }
    async refresh(req, res) {
        await this.run(res, async () => {
            res.status(200).json(await this.service.refresh(req.body, deviceInfo(req)));
        });
    }
    async logout(req, res) {
        await this.run(res, async () => {
            await this.service.logout(req.body);
            res.status(200).json({ message: "Session closed" });
        });
    }
    async profile(req, res) {
        await this.run(res, async () => {
            res.status(200).json({ user: await this.service.profile((0, auth_user_1.requireAuthUser)(req).id) });
        });
    }
    async myPermissions(req, res) {
        await this.run(res, async () => {
            res.status(200).json({ permissions: await this.service.myPermissions((0, auth_user_1.requireAuthUser)(req).id) });
        });
    }
}
exports.SessionController = SessionController;
function deviceInfo(req) {
    const userAgent = req.headers["user-agent"];
    return userAgent ? String(userAgent).slice(0, 500) : null;
}
//# sourceMappingURL=session.controller.js.map