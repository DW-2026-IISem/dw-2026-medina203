"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductTypesService = void 0;
const dto_1 = require("./dto");
const product_types_repository_1 = require("./product-types.repository");
const app_error_1 = require("../../../shared/errors/app-error");
/**
 * Capa Service del feature ProductTypes.
 *
 * Reglas de negocio: default de `status`, política de borrado lógico y borrado
 * físico. No conoce `req`/`res` ni escribe Sequelize: delega en el repository y
 * devuelve **DTOs** (carpeta `dto/`).
 */
class ProductTypesService {
    constructor(repository = new product_types_repository_1.ProductTypesRepository()) {
        this.repository = repository;
    }
    // ================== READ ==================
    async getAll() {
        const productTypes = await this.repository.findAllActive();
        return productTypes.map((productType) => (0, dto_1.toProductTypeResponse)(productType));
    }
    async getOne(id) {
        return (0, dto_1.toProductTypeResponse)(await this.findOrFail(id));
    }
    // ================== CREATE ==================
    async create(body) {
        // Copia campo a campo a propósito (evita *mass assignment*).
        const productType = await this.repository.create({
            name: body.name,
            description: body.description ?? null,
            status: body.status ?? "active",
        });
        return (0, dto_1.toProductTypeResponse)(productType);
    }
    // ================== UPDATE ==================
    async updatePut(id, body) {
        const productType = await this.findOrFail(id);
        await this.repository.update(productType, {
            name: body.name,
            description: body.description ?? null,
        });
        return (0, dto_1.toProductTypeResponse)(productType);
    }
    async updatePatch(id, body) {
        const productType = await this.findOrFail(id);
        await this.repository.update(productType, body);
        return (0, dto_1.toProductTypeResponse)(productType);
    }
    // ================== DELETE ==================
    /** Eliminación física. */
    async deletePhysical(id) {
        const productType = await this.findOrFail(id, false);
        await this.repository.delete(productType);
    }
    /** Eliminación lógica -> `status = inactive`. */
    async deleteLogical(id) {
        const productType = await this.findOrFail(id);
        await this.repository.update(productType, { status: "inactive" });
        return (0, dto_1.toProductTypeResponse)(productType);
    }
    // ================== HELPERS ==================
    /**
     * Busca por PK y falla con 404 si no existe.
     *
     * `onlyActive` (por defecto `true`) aplica la política de borrado lógico.
     */
    async findOrFail(id, onlyActive = true) {
        const productType = await this.repository.findById(id);
        if (!productType || (onlyActive && productType.status !== "active")) {
            throw new app_error_1.AppError(404, "Product type not found");
        }
        return productType;
    }
}
exports.ProductTypesService = ProductTypesService;
//# sourceMappingURL=product-types.service.js.map