import dotenv from "dotenv";
import { sequelize, testConnection } from "../db";
import { resolveSeedCounts } from "./counts";
import "../../features/business/customers/customer.model";
import { seedCustomers } from "../../features/business/customers/customers.seeder";
import "../../features/business/garment-types/garment-type.model";
import { seedGarmentTypes } from "../../features/business/garment-types/garment-types.seeder";

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

  await seedCustomers(counts.customers);
  await seedGarmentTypes(counts.garment_types);

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
