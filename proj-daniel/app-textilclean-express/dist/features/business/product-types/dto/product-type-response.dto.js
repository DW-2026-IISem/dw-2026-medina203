"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toProductTypeResponse = toProductTypeResponse;
/** Mapper modelo -> DTO de respuesta (objeto plano, sin métodos de Sequelize). */
function toProductTypeResponse(productType) {
    return productType.toJSON();
}
//# sourceMappingURL=product-type-response.dto.js.map