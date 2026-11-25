import { OPERATOR_RESOURCES, RESOURCE_CATALOG } from "../resources/resource-catalog";
import { Resource } from "../resources/resource.model";
import { Role } from "../roles/role.model";
import { ResourceRolesService } from "./resource-roles.service";

/**
 * Seeder de ResourceRoles (matriz de permisos), reconciliador:
 *   ADMIN    → todo RESOURCE_CATALOG
 *   OPERATOR → OPERATOR_RESOURCES
 * Re-ejecutarlo deja la matriz exacta (activa lo que falta, retira lo que sobra).
 */
export async function seedResourceRoles(): Promise<number> {
  const resourceByOperation = new Map<string, Resource>();
  for (const resource of await Resource.findAll({ where: { status: "active" } })) {
    resourceByOperation.set(`${resource.method} ${resource.path}`, resource);
  }

  const matrix = { ADMIN: RESOURCE_CATALOG, OPERATOR: OPERATOR_RESOURCES } as const;
  const reconcile = new ResourceRolesService();
  let changes = 0;
  for (const [roleName, catalog] of Object.entries(matrix)) {
    const role = await Role.findOne({ where: { name: roleName, status: "active" } });
    if (!role) continue;
    const resourceIds = catalog.map((entry) => {
      const resource = resourceByOperation.get(`${entry.method} ${entry.path}`);
      if (!resource) throw new Error(`Missing seeded resource ${entry.method} ${entry.path}`);
      return resource.id;
    });
    const result = await reconcile.reconcileRole(role.id, resourceIds);
    changes += result.activated + result.deactivated;
    console.log(`✅ resource_roles: ${roleName} → ${result.total_active} permisos (+${result.activated} / -${result.deactivated})`);
  }
  return changes;
}
