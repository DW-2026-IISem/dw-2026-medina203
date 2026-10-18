"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const base_controller_1 = require("../../../shared/http/base-controller");
const products_service_1 = require("./products.service");
class ProductsController extends base_controller_1.BaseController {
    constructor(service = new products_service_1.ProductsService()) {
        super();
        this.service = service;
    }
    async getAll(_req, res) {
        await this.run(res, async () => {
            const products = await this.service.getAll();
            res.status(200).json({ products });
        });
    }
    async getOne(req, res) {
        await this.run(res, async () => {
            const product = await this.service.getOne(this.paramId(req));
            res.status(200).json({ product });
        });
    }
    async create(req, res) {
        await this.run(res, async () => {
            const product = await this.service.create(req.body);
            res.status(201).json({ product });
        });
    }
    async updatePut(req, res) {
        await this.run(res, async () => {
            const product = await this.service.updatePut(this.paramId(req), req.body);
            res.status(200).json({ product });
        });
    }
    async updatePatch(req, res) {
        await this.run(res, async () => {
            const product = await this.service.updatePatch(this.paramId(req), req.body);
            res.status(200).json({ product });
        });
    }
    async deletePhysical(req, res) {
        await this.run(res, async () => {
            const id = this.paramId(req);
            await this.service.deletePhysical(id);
            res.status(200).json({ message: "Product permanently deleted", id });
        });
    }
    async deleteLogical(req, res) {
        await this.run(res, async () => {
            const product = await this.service.deleteLogical(this.paramId(req));
            res.status(200).json({ message: "Product deactivated (logical delete)", product });
        });
    }
}
exports.ProductsController = ProductsController;
//# sourceMappingURL=products.controller.js.map