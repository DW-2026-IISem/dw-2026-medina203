"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductTypesController = void 0;
const base_controller_1 = require("../../../shared/http/base-controller");
const product_types_service_1 = require("./product-types.service");
/**
 * Capa Controller del feature ProductTypes.
 * Solo HTTP: lee `req`, llama al service y arma la respuesta.
 * El manejo de errores se delega en `run()` (ver `BaseController`).
 */
class ProductTypesController extends base_controller_1.BaseController {
    constructor(service = new product_types_service_1.ProductTypesService()) {
        super();
        this.service = service;
    }
    // ================== READ ==================
    async getAll(_req, res) {
        await this.run(res, async () => {
            const product_types = await this.service.getAll();
            res.status(200).json({ product_types });
        });
    }
    async getOne(req, res) {
        await this.run(res, async () => {
            const product_type = await this.service.getOne(this.paramId(req));
            res.status(200).json({ product_type });
        });
    }
    // ================== CREATE ==================
    async create(req, res) {
        await this.run(res, async () => {
            const product_type = await this.service.create(req.body);
            res.status(201).json({ product_type });
        });
    }
    // ================== UPDATE ==================
    async updatePut(req, res) {
        await this.run(res, async () => {
            const product_type = await this.service.updatePut(this.paramId(req), req.body);
            res.status(200).json({ product_type });
        });
    }
    async updatePatch(req, res) {
        await this.run(res, async () => {
            const product_type = await this.service.updatePatch(this.paramId(req), req.body);
            res.status(200).json({ product_type });
        });
    }
    // ================== DELETE ==================
    /** Eliminación física. */
    async deletePhysical(req, res) {
        await this.run(res, async () => {
            const id = this.paramId(req);
            await this.service.deletePhysical(id);
            res.status(200).json({ message: "Product type permanently deleted", id });
        });
    }
    /** Eliminación lógica -> `status = inactive`. */
    async deleteLogical(req, res) {
        await this.run(res, async () => {
            const product_type = await this.service.deleteLogical(this.paramId(req));
            res.status(200).json({
                message: "Product type deactivated (logical delete)",
                product_type,
            });
        });
    }
}
exports.ProductTypesController = ProductTypesController;
//# sourceMappingURL=product-types.controller.js.map