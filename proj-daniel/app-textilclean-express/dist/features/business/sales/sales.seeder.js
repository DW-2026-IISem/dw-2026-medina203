"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSales = seedSales;
const faker_1 = require("@faker-js/faker");
const client_model_1 = require("../clients/client.model");
const sale_model_1 = require("./sale.model");
async function seedSales(count) {
    if (count <= 0 || (await sale_model_1.Sale.count()) > 0)
        return 0;
    const clients = await client_model_1.Client.findAll({ where: { status: "active" } });
    if (clients.length === 0)
        return 0;
    const rows = Array.from({ length: count }, () => {
        const client = clients[Math.floor(Math.random() * clients.length)];
        return {
            client_id: client.id,
            sale_date: faker_1.faker.date.recent({ days: 30 }),
            subtotal: 0,
            tax: 0,
            discounts: 0,
            total: 0,
            status: "active",
        };
    });
    await sale_model_1.Sale.bulkCreate(rows);
    return rows.length;
}
//# sourceMappingURL=sales.seeder.js.map