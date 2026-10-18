"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllSeeders = runAllSeeders;
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../db");
require("../../features/business/clients/client.model");
const clients_seeder_1 = require("../../features/business/clients/clients.seeder");
const counts_1 = require("./counts");
require("../../features/business/product-types/product-type.model");
const product_types_seeder_1 = require("../../features/business/product-types/product-types.seeder");
require("../../features/business/products/product.model");
require("../../features/business/products/products.associations");
const products_seeder_1 = require("../../features/business/products/products.seeder");
require("../../features/business/sales/sale.model");
require("../../features/business/product-sales/product-sale.model");
require("../../features/business/sales/sales.associations");
require("../../features/business/product-sales/product-sales.associations");
const sales_seeder_1 = require("../../features/business/sales/sales.seeder");
const product_sales_seeder_1 = require("../../features/business/product-sales/product-sales.seeder");
const users_seeder_1 = require("../../features/auth/users/users.seeder");
const roles_seeder_1 = require("../../features/auth/roles/roles.seeder");
const resources_seeder_1 = require("../../features/auth/resources/resources.seeder");
const role_users_seeder_1 = require("../../features/auth/role-users/role-users.seeder");
const resource_roles_seeder_1 = require("../../features/auth/resource-roles/resource-roles.seeder");
require("../../features/auth/users/user.model");
require("../../features/auth/roles/role.model");
require("../../features/auth/resources/resource.model");
require("../../features/auth/role-users/role-user.model");
require("../../features/auth/resource-roles/resource-role.model");
require("../../features/auth/refresh-tokens/refresh-token.model");
require("../../features/auth/rbac.associations");
dotenv_1.default.config();
/**
 * SeedersRunner — ejecuta TODOS los seeders de features.
 *
 * Ubicación: `src/database/seeders/` (orquestación fuera de cada feature).
 * Cada feature exporta su seeder (ej. `features/business/clients/clients.seeder.ts`).
 *
 * Uso:
 *   npm run db:seed
 *   npm run db:seed -- --clients=20
 *   SEED_CLIENTS=5 npm run db:seed
 */
async function runAllSeeders() {
    const counts = (0, counts_1.resolveSeedCounts)();
    console.log("🌱 Iniciando SeedersRunner...");
    console.log("📊 Conteos:", counts);
    const ok = await (0, db_1.testConnection)();
    if (!ok) {
        throw new Error("No hay conexión a la base de datos");
    }
    await db_1.sequelize.sync({ force: false, alter: true });
    // Orden: business (padres → hijos)
    await (0, clients_seeder_1.seedClients)(counts.clients);
    await (0, product_types_seeder_1.seedProductTypes)(counts.product_types);
    await (0, products_seeder_1.seedProducts)(counts.products);
    await (0, sales_seeder_1.seedSales)(counts.sales);
    await (0, product_sales_seeder_1.seedProductSales)(counts.product_sales);
    await (0, users_seeder_1.seedUsers)(counts.users);
    await (0, roles_seeder_1.seedRoles)();
    await (0, resources_seeder_1.seedResources)();
    await (0, role_users_seeder_1.seedRoleUsers)();
    await (0, resource_roles_seeder_1.seedResourceRoles)();
    console.log("🌱 SeedersRunner finalizado");
}
if (require.main === module) {
    runAllSeeders()
        .then(async () => {
        await db_1.sequelize.close();
        process.exit(0);
    })
        .catch(async (err) => {
        console.error("❌ Error en seeders:", err);
        await db_1.sequelize.close();
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map