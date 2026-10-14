import { faker } from "@faker-js/faker";
import { sequelize } from "../../../database/db";
import { Product } from "../products/product.model";
import { Sale } from "../sales/sale.model";
import { ProductSale } from "./product-sale.model";

export async function seedProductSales(count: number): Promise<number> {
  if (count <= 0 || (await ProductSale.count()) > 0) return 0;

  const sales = await Sale.findAll({ where: { status: "active" } });
  const products = await Product.findAll({ where: { status: "active" } });
  if (sales.length === 0 || products.length === 0) return 0;

  let created = 0;
  let attempt = 0;
  const maxAttempts = count * Math.max(products.length, 1) * 2;
  while (created < count && attempt < maxAttempts) {
    const sale = sales[attempt % sales.length];
    const product = products[Math.floor(Math.random() * products.length)];
    attempt += 1;

    const transaction = await sequelize.transaction();
    try {
      const currentProduct = await Product.findByPk(product.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!currentProduct || currentProduct.status !== "active" || currentProduct.quantity < 1) {
        await transaction.rollback();
        continue;
      }

      const quantity = faker.number.int({ min: 1, max: Math.min(3, currentProduct.quantity) });
      const unitPrice = Number(currentProduct.price);
      const lineTotal = roundMoney(unitPrice * quantity);
      await ProductSale.create(
        {
          sale_id: sale.id,
          product_id: currentProduct.id,
          quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
          status: "active",
        },
        { transaction }
      );
      await currentProduct.update({ quantity: currentProduct.quantity - quantity }, { transaction });

      const lines = await ProductSale.findAll({
        where: { sale_id: sale.id, status: "active" },
        transaction,
      });
      const subtotal = roundMoney(lines.reduce((sum, line) => sum + Number(line.line_total), 0));
      await sale.update({ subtotal, total: roundMoney(subtotal + Number(sale.tax) - Number(sale.discounts)) }, { transaction });
      await transaction.commit();
      created += 1;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  return created;
}

function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}