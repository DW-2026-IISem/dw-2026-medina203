"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const base_controller_1 = require("../../../shared/http/base-controller");
const users_service_1 = require("./users.service");
class UsersController extends base_controller_1.BaseController {
    constructor(service = new users_service_1.UsersService()) {
        super();
        this.service = service;
    }
    async getAll(_req, res) {
        await this.run(res, async () => {
            res.status(200).json({ users: await this.service.getAll() });
        });
    }
    async getOne(req, res) {
        await this.run(res, async () => {
            res.status(200).json({ user: await this.service.getOne(this.paramId(req)) });
        });
    }
    async getEffectivePermissions(req, res) {
        await this.run(res, async () => {
            const permissions = await this.service.getEffectivePermissions(this.paramId(req));
            res.status(200).json({ permissions });
        });
    }
    async create(req, res) {
        await this.run(res, async () => {
            res.status(201).json({ user: await this.service.create(req.body) });
        });
    }
    async updatePut(req, res) {
        await this.run(res, async () => {
            res.status(200).json({
                user: await this.service.updatePut(this.paramId(req), req.body),
            });
        });
    }
    async updatePatch(req, res) {
        await this.run(res, async () => {
            res.status(200).json({
                user: await this.service.updatePatch(this.paramId(req), req.body),
            });
        });
    }
    async deletePhysical(req, res) {
        await this.run(res, async () => {
            const id = this.paramId(req);
            await this.service.deletePhysical(id);
            res.status(200).json({ message: "User permanently deleted", id });
        });
    }
    async deleteLogical(req, res) {
        await this.run(res, async () => {
            const user = await this.service.deleteLogical(this.paramId(req));
            res.status(200).json({ message: "User deactivated (logical delete)", user });
        });
    }
    async changePassword(req, res) {
        await this.run(res, async () => {
            const id = this.paramId(req);
            await this.service.changePassword(id, req.body);
            res.status(200).json({ message: "Password updated", id });
        });
    }
}
exports.UsersController = UsersController;
//# sourceMappingURL=users.controller.js.map