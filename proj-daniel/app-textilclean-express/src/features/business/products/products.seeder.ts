import { faker } from "@faker-js/faker";
import { Product } from "./product.model";
import { ProductType } from "../product-types/product-type.model";

export async function seedProducts(count: number): Promise<number> {
  if (count <= 0) return 0;

  const existing = await Product.count();
  if (existing > 0) return 0;

  const productTypes = await ProductType.findAll({ where: { status: "active" } });
  if (productTypes.length === 0) return 0;

  const rows = Array.from({ length: count }, () => {
    const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
    return {
      name: faker.commerce.productName(),
      brand: faker.company.name(),
      price: Number(faker.commerce.price({ min: 5, max: 500, dec: 2 })),
      min_stock: faker.number.int({ min: 1, max: 10 }),
      quantity: faker.number.int({ min: 20, max: 100 }),
      product_type_id: productType.id,
      status: "active" as const,
    };
  });

  await Product.bulkCreate(rows);
  return rows.length;
}