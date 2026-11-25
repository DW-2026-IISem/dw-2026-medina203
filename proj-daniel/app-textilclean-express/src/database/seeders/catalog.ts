import dotenv from "dotenv";
import { sequelize, testConnection } from "../db";
import "../../features/auth/resources/resource.model";
import { findOrphanResources, seedResources } from "../../features/auth/resources/resources.seeder";

dotenv.config({ quiet: true });

/**
 * Sincroniza SOLO el catálogo de recursos (`resources`) con RESOURCE_CATALOG.
 *
 *   npm run db:seed:catalog
 *
 * A diferencia de `npm run db:seed`, NO reconcilia `resource_roles`: conserva la
 * matriz que el administrador configuró en el panel de roles y permisos. Úsalo
 * cuando agregues una ruta nueva al catálogo en una base con permisos ajustados
 * a mano; después concédela desde el panel.
 */
export async function syncCatalog(): Promise<void> {
  if (!(await testConnection())) throw new Error("No hay conexión a la base de datos");
  await seedResources();
  const orphans = await findOrphanResources();
  if (orphans.length > 0) {
    console.log(`⚠️  ${orphans.length} recurso(s) activos fuera del catálogo (no se modifican):`);
    for (const orphan of orphans) console.log(`   - ${orphan}`);
  }
  console.log("✅ Catálogo sincronizado; concesiones (resource_roles) sin cambios");
}

if (require.main === module) {
  syncCatalog()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Error sincronizando catálogo:", err);
      await sequelize.close();
      process.exit(1);
    });
}
