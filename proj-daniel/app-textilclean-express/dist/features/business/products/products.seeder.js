"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedProducts = seedProducts;
const faker_1 = require("@faker-js/faker");
const product_model_1 = require("./product.model");
const product_type_model_1 = require("../product-types/product-type.model");
async function seedProducts(count) {
    if (count <= 0)
        return 0;
    const existing = await product_model_1.Product.count();
    if (existing > 0)
        return 0;
    const productTypes = await product_type_model_1.ProductType.findAll({ where: { status: "active" } });
    if (productTypes.length === 0)
        return 0;
    const rows = Array.from({ length: count }, () => {
        const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
        return {
            name: faker_1.faker.commerce.productName(),
            brand: faker_1.faker.company.name(),
            price: Number(faker_1.faker.commerce.price({ min: 5, max: 500, dec: 2 })),
            min_stock: faker_1.faker.number.int({ min: 1, max: 10 }),
            quantity: faker_1.faker.number.int({ min: 20, max: 100 }),
            product_type_id: productType.id,
            status: "active",
        };
    });
    await product_model_1.Product.bulkCreate(rows);
    return rows.length;
}
//# sourceMappingURL=products.seeder.js.map