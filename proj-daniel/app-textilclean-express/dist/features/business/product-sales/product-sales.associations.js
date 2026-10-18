"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const product_model_1 = require("../products/product.model");
const sale_model_1 = require("../sales/sale.model");
const product_sale_model_1 = require("./product-sale.model");
product_sale_model_1.ProductSale.belongsTo(sale_model_1.Sale, { foreignKey: "sale_id", as: "sale" });
product_sale_model_1.ProductSale.belongsTo(product_model_1.Product, { foreignKey: "product_id", as: "product" });
sale_model_1.Sale.hasMany(product_sale_model_1.ProductSale, { foreignKey: "sale_id", as: "items" });
product_model_1.Product.hasMany(product_sale_model_1.ProductSale, { foreignKey: "product_id", as: "sale_items" });
//# sourceMappingURL=product-sales.associations.js.map