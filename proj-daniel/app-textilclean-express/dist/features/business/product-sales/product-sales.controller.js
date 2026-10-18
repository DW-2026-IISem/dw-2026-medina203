"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSalesController = void 0;
const base_controller_1 = require("../../../shared/http/base-controller");
const product_sales_service_1 = require("./product-sales.service");
class ProductSalesController extends base_controller_1.BaseController {
    constructor(service = new product_sales_service_1.ProductSalesService()) {
        super();
        this.service = service;
    }
    async getAll(_req, res) {
        await this.run(res, async () => {
            res.status(200).json({ product_sales: await this.service.getAll() });
        });
    }
    async getOne(req, res) {
        await this.run(res, async () => {
            res.status(200).json({ product_sale: await this.service.getOne(this.paramId(req)) });
        });
    }
    async create(req, res) {
        await this.run(res, async () => {
            const product_sale = await this.service.create(req.body);
            res.status(201).json({ product_sale });
        });
    }
    async updatePut(req, res) {
        await this.run(res, async () => {
            const product_sale = await this.service.updatePut(this.paramId(req), req.body);
            res.status(200).json({ product_sale });
        });
    }
    async updatePatch(req, res) {
        await this.run(res, async () => {
            const product_sale = await this.service.updatePatch(this.paramId(req), req.body);
            res.status(200).json({ product_sale });
        });
    }
    async deletePhysical(req, res) {
        await this.run(res, async () => {
            const id = this.paramId(req);
            await this.service.deletePhysical(id);
            res.status(200).json({ message: "Product sale permanently deleted", id });
        });
    }
    async deleteLogical(req, res) {
        await this.run(res, async () => {
            const product_sale = await this.service.deleteLogical(this.paramId(req));
            res.status(200).json({ message: "Product sale deactivated", product_sale });
        });
    }
}
exports.ProductSalesController = ProductSalesController;
//# sourceMappingURL=product-sales.controller.js.map