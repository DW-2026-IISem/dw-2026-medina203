"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceRolesController = void 0;
const base_controller_1 = require("../../../shared/http/base-controller");
const resource_roles_service_1 = require("./resource-roles.service");
class ResourceRolesController extends base_controller_1.BaseController {
    constructor(service = new resource_roles_service_1.ResourceRolesService()) {
        super();
        this.service = service;
    }
    async getAll(req, res) {
        await this.run(res, async () => {
            const grants = await this.service.getAll({
                role_id: parseOptionalId(req.query.role_id),
                resource_id: parseOptionalId(req.query.resource_id),
            });
            res.status(200).json({ grants });
        });
    }
    async getOne(req, res) {
        await this.run(res, async () => { res.status(200).json({ grant: await this.service.getOne(this.paramId(req)) }); });
    }
    async grant(req, res) {
        await this.run(res, async () => { res.status(201).json({ grant: await this.service.grant(req.body) }); });
    }
    async deactivate(req, res) {
        await this.run(res, async () => { res.status(200).json({ grant: await this.service.deactivate(this.paramId(req)) }); });
    }
    async reactivate(req, res) {
        await this.run(res, async () => { res.status(200).json({ grant: await this.service.reactivate(this.paramId(req)) }); });
    }
}
exports.ResourceRolesController = ResourceRolesController;
function parseOptionalId(value) {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw))
        return undefined;
    return Number(raw);
}
//# sourceMappingURL=resource-roles.controller.js.map