import dotenv from "dotenv";
import { sequelize, testConnection } from "../db";
import { resolveSeedCounts } from "./counts";
import "../../features/business/customers/customer.model";
import { seedCustomers } from "../../features/business/customers/customers.seeder";
import "../../features/business/garment-types/garment-type.model";
import { seedGarmentTypes } from "../../features/business/garment-types/garment-types.seeder";
import "../../features/business/laundry-services/laundry-service.model";
import "../../features/business/laundry-services/laundry-services.associations";
import { seedLaundryServices } from "../../features/business/laundry-services/laundry-services.seeder";
import "../../features/business/service-orders/service-order.model";
import "../../features/business/service-order-items/service-order-item.model";
import "../../features/business/service-orders/service-orders.associations";
import "../../features/business/service-order-items/service-order-items.associations";
import "../../features/auth/users/user.model";
import "../../features/auth/roles/role.model";
import "../../features/auth/resources/resource.model";
import "../../features/auth/role-users/role-user.model";
import "../../features/auth/resource-roles/resource-role.model";
import "../../features/auth/refresh-tokens/refresh-token.model";
import "../../features/auth/rbac.associations";
import { seedUsers } from "../../features/auth/users/users.seeder";
import { seedServiceOrders } from "../../features/business/service-orders/service-orders.seeder";
import { seedServiceOrderItems } from "../../features/business/service-order-items/service-order-items.seeder";

dotenv.config({ quiet: true });

/**
 * SeedersRunner — ejecuta los seeders de todos los features (padres → hijos).
 *
 * Uso:
 *   npm run db:seed
 *   npm run db:seed -- --customers=20
 *   SEED_CUSTOMERS=5 npm run db:seed
 */
export async function runAllSeeders(): Promise<void> {
  const counts = resolveSeedCounts();
  console.log("🌱 Iniciando SeedersRunner...");
  console.log("📊 Conteos:", counts);

  if (!(await testConnection())) throw new Error("No hay conexión a la base de datos");
  await sequelize.sync({ alter: true });

  // 1) Seguridad
  await seedUsers(counts.users);

  // 2) Negocio (padres → hijos)
  await seedCustomers(counts.customers);
  await seedGarmentTypes(counts.garment_types);
  await seedLaundryServices(counts.laundry_services);
  // service_orders antes que service_order_items
  const createdOrders = await seedServiceOrders(counts.service_orders);
  if (createdOrders > 0) await seedServiceOrderItems(counts.service_order_items);

  console.log("🌱 SeedersRunner finalizado");
}

if (require.main === module) {
  runAllSeeders()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Error en seeders:", err);
      await sequelize.close();
      process.exit(1);
    });
}
