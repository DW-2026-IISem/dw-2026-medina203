"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const product_model_1 = require("./product.model");
const product_type_model_1 = require("../product-types/product-type.model");
product_model_1.Product.belongsTo(product_type_model_1.ProductType, { foreignKey: "product_type_id", as: "product_type" });
product_type_model_1.ProductType.hasMany(product_model_1.Product, { foreignKey: "product_type_id", as: "products" });
//# sourceMappingURL=products.associations.js.map