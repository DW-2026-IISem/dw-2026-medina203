import { Product } from "../products/product.model";
import { Sale } from "../sales/sale.model";
import { ProductSale } from "./product-sale.model";

ProductSale.belongsTo(Sale, { foreignKey: "sale_id", as: "sale" });
ProductSale.belongsTo(Product, { foreignKey: "product_id", as: "product" });
Sale.hasMany(ProductSale, { foreignKey: "sale_id", as: "items" });
Product.hasMany(ProductSale, { foreignKey: "product_id", as: "sale_items" });