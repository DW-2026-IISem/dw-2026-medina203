"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductTypesRepository = void 0;
const product_type_model_1 = require("./product-type.model");
/**
 * Capa Repository del feature ProductTypes.
 *
 * Única responsable de hablar con Sequelize (el modelo `ProductType`).
 */
class ProductTypesRepository {
    /** Todos los tipos activos. */
    async findAllActive() {
        return product_type_model_1.ProductType.findAll({ where: { status: "active" } });
    }
    /** Un tipo por PK (o `null`). */
    async findById(id) {
        return product_type_model_1.ProductType.findByPk(id);
    }
    /** Inserta un tipo de producto. */
    async create(data) {
        return product_type_model_1.ProductType.create(data);
    }
    /** Persiste cambios sobre una instancia existente. */
    async update(productType, data) {
        return productType.update(data);
    }
    /** Elimina físicamente una instancia. */
    async delete(productType) {
        await productType.destroy();
    }
}
exports.ProductTypesRepository = ProductTypesRepository;
//# sourceMappingURL=product-types.repository.js.map