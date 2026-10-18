"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../../../database/db");
class Product extends sequelize_1.Model {
}
exports.Product = Product;
Product.init({
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    brand: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    price: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false },
    min_stock: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    quantity: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    product_type_id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: {
        type: sequelize_1.DataTypes.ENUM("active", "inactive"),
        defaultValue: "inactive",
        allowNull: false,
    },
}, {
    sequelize: db_1.sequelize,
    modelName: "Product",
    tableName: "products",
    timestamps: true,
});
//# sourceMappingURL=product.model.js.map