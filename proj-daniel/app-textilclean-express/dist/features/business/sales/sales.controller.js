"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesController = void 0;
const base_controller_1 = require("../../../shared/http/base-controller");
const sales_service_1 = require("./sales.service");
class SalesController extends base_controller_1.BaseController {
    constructor(service = new sales_service_1.SalesService()) {
        super();
        this.service = service;
    }
    async getAll(_req, res) {
        await this.run(res, async () => {
            res.status(200).json({ sales: await this.service.getAll() });
        });
    }
    async getOne(req, res) {
        await this.run(res, async () => {
            res.status(200).json({ sale: await this.service.getOne(this.paramId(req)) });
        });
    }
    async create(req, res) {
        await this.run(res, async () => {
            const sale = await this.service.create(req.body);
            res.status(201).json({ sale });
        });
    }
    async updatePut(req, res) {
        await this.run(res, async () => {
            const sale = await this.service.updatePut(this.paramId(req), req.body);
            res.status(200).json({ sale });
        });
    }
    async updatePatch(req, res) {
        await this.run(res, async () => {
            const sale = await this.service.updatePatch(this.paramId(req), req.body);
            res.status(200).json({ sale });
        });
    }
    async deletePhysical(req, res) {
        await this.run(res, async () => {
            const id = this.paramId(req);
            await this.service.deletePhysical(id);
            res.status(200).json({ message: "Sale permanently deleted", id });
        });
    }
    async deleteLogical(req, res) {
        await this.run(res, async () => {
            const sale = await this.service.deleteLogical(this.paramId(req));
            res.status(200).json({ message: "Sale deactivated", sale });
        });
    }
}
exports.SalesController = SalesController;
//# sourceMappingURL=sales.controller.js.map