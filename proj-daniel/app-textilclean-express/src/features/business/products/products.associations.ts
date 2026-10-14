import { Product } from "./product.model";
import { ProductType } from "../product-types/product-type.model";

Product.belongsTo(ProductType, { foreignKey: "product_type_id", as: "product_type" });
ProductType.hasMany(Product, { foreignKey: "product_type_id", as: "products" });