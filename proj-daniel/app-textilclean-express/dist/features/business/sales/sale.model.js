"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sale = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../../../database/db");
class Sale extends sequelize_1.Model {
}
exports.Sale = Sale;
Sale.init({
    sale_date: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    subtotal: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    tax: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    discounts: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    total: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    client_id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: {
        type: sequelize_1.DataTypes.ENUM("active", "inactive"),
        defaultValue: "inactive",
        allowNull: false,
    },
}, { sequelize: db_1.sequelize, modelName: "Sale", tableName: "sales", timestamps: true });
//# sourceMappingURL=sale.model.js.map