"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedProductSales = seedProductSales;
const faker_1 = require("@faker-js/faker");
const db_1 = require("../../../database/db");
const product_model_1 = require("../products/product.model");
const sale_model_1 = require("../sales/sale.model");
const product_sale_model_1 = require("./product-sale.model");
async function seedProductSales(count) {
    if (count <= 0 || (await product_sale_model_1.ProductSale.count()) > 0)
        return 0;
    const sales = await sale_model_1.Sale.findAll({ where: { status: "active" } });
    const products = await product_model_1.Product.findAll({ where: { status: "active" } });
    if (sales.length === 0 || products.length === 0)
        return 0;
    let created = 0;
    let attempt = 0;
    const maxAttempts = count * Math.max(products.length, 1) * 2;
    while (created < count && attempt < maxAttempts) {
        const sale = sales[attempt % sales.length];
        const product = products[Math.floor(Math.random() * products.length)];
        attempt += 1;
        const transaction = await db_1.sequelize.transaction();
        try {
            const currentProduct = await product_model_1.Product.findByPk(product.id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!currentProduct || currentProduct.status !== "active" || currentProduct.quantity < 1) {
                await transaction.rollback();
                continue;
            }
            const quantity = faker_1.faker.number.int({ min: 1, max: Math.min(3, currentProduct.quantity) });
            const unitPrice = Number(currentProduct.price);
            const lineTotal = roundMoney(unitPrice * quantity);
            await product_sale_model_1.ProductSale.create({
                sale_id: sale.id,
                product_id: currentProduct.id,
                quantity,
                unit_price: unitPrice,
                line_total: lineTotal,
                status: "active",
            }, { transaction });
            await currentProduct.update({ quantity: currentProduct.quantity - quantity }, { transaction });
            const lines = await product_sale_model_1.ProductSale.findAll({
                where: { sale_id: sale.id, status: "active" },
                transaction,
            });
            const subtotal = roundMoney(lines.reduce((sum, line) => sum + Number(line.line_total), 0));
            await sale.update({ subtotal, total: roundMoney(subtotal + Number(sale.tax) - Number(sale.discounts)) }, { transaction });
            await transaction.commit();
            created += 1;
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    return created;
}
function roundMoney(amount) {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
}
//# sourceMappingURL=product-sales.seeder.js.map