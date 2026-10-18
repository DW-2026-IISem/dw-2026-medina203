"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSale = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../../../database/db");
class ProductSale extends sequelize_1.Model {
}
exports.ProductSale = ProductSale;
ProductSale.init({
    sale_id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false },
    product_id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    unit_price: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false },
    line_total: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
        type: sequelize_1.DataTypes.ENUM("active", "inactive"),
        defaultValue: "inactive",
        allowNull: false,
    },
}, { sequelize: db_1.sequelize, modelName: "ProductSale", tableName: "product_sales", timestamps: true });
//# sourceMappingURL=product-sale.model.js.map