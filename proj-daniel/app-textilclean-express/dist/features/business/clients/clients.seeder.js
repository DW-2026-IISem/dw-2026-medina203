"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedClients = seedClients;
const faker_1 = require("@faker-js/faker");
const client_model_1 = require("./client.model");
/**
 * Seeder del feature Client (datos falsos con @faker-js/faker).
 * Se invoca desde `src/database/seeders` (SeedersRunner), no desde la App.
 *
 * Idempotente: si ya hay filas, no vuelve a insertar.
 */
async function seedClients(count) {
    if (count <= 0) {
        console.log("⏭️  clients: count=0, se omite");
        return 0;
    }
    const existing = await client_model_1.Client.count();
    if (existing > 0) {
        console.log(`⏭️  clients: ya hay ${existing} registro(s), se omite seeder`);
        return 0;
    }
    const rows = Array.from({ length: count }, (_, i) => ({
        name: faker_1.faker.person.fullName(),
        address: faker_1.faker.location.streetAddress(),
        phone: faker_1.faker.phone.number({ style: "national" }),
        email: `client.${i}.${faker_1.faker.string.alphanumeric(6)}@example.com`.toLowerCase(),
        password: "Password123!",
        status: "active",
    }));
    await client_model_1.Client.bulkCreate(rows);
    console.log(`✅ clients: insertados ${count} registro(s) falsos`);
    return count;
}
//# sourceMappingURL=clients.seeder.js.map