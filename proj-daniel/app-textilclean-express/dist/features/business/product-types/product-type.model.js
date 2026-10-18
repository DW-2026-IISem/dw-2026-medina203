"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductType = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../../../database/db");
class ProductType extends sequelize_1.Model {
}
exports.ProductType = ProductType;
ProductType.init({
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("active", "inactive"),
        // Fail-safe: una fila insertada sin estado explícito NO queda visible en la API.
        // La vía de creación de la API siempre envía "active".
        defaultValue: "inactive",
        allowNull: false,
    },
}, {
    sequelize: db_1.sequelize,
    modelName: "ProductType",
    tableName: "product_types",
    timestamps: true,
});
//# sourceMappingURL=product-type.model.js.map