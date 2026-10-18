"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesController = void 0;
const base_controller_1 = require("../../../shared/http/base-controller");
const roles_service_1 = require("./roles.service");
class RolesController extends base_controller_1.BaseController {
    constructor(service = new roles_service_1.RolesService()) {
        super();
        this.service = service;
    }
    async getAll(_req, res) {
        await this.run(res, async () => { res.status(200).json({ roles: await this.service.getAll() }); });
    }
    async getOne(req, res) {
        await this.run(res, async () => { res.status(200).json({ role: await this.service.getOne(this.paramId(req)) }); });
    }
    async create(req, res) {
        await this.run(res, async () => { res.status(201).json({ role: await this.service.create(req.body) }); });
    }
    async updatePut(req, res) {
        await this.run(res, async () => { res.status(200).json({ role: await this.service.updatePut(this.paramId(req), req.body) }); });
    }
    async updatePatch(req, res) {
        await this.run(res, async () => { res.status(200).json({ role: await this.service.updatePatch(this.paramId(req), req.body) }); });
    }
    async deletePhysical(req, res) {
        await this.run(res, async () => { const id = this.paramId(req); await this.service.deletePhysical(id); res.status(200).json({ message: "Role permanently deleted", id }); });
    }
    async deleteLogical(req, res) {
        await this.run(res, async () => { const role = await this.service.deleteLogical(this.paramId(req)); res.status(200).json({ message: "Role deactivated", role }); });
    }
}
exports.RolesController = RolesController;
//# sourceMappingURL=roles.controller.js.map