import { RESOURCE_CATALOG, SELLER_RESOURCES } from "../resources/resource-catalog";
import { Resource } from "../resources/resource.model";
import { Role } from "../roles/role.model";
import { ResourceRolesService } from "./resource-roles.service";

export async function seedResourceRoles(): Promise<number> {
  const resourceByOperation = new Map<string, Resource>();
  for (const resource of await Resource.findAll({ where: { status: "active" } })) {
    resourceByOperation.set(`${resource.method} ${resource.path}`, resource);
  }

  const reconcile = new ResourceRolesService();
  let changes = 0;
  for (const roleName of ["ADMIN", "SELLER"] as const) {
    const role = await Role.findOne({ where: { name: roleName, status: "active" } });
    if (!role) continue;
    const catalog = roleName === "ADMIN" ? RESOURCE_CATALOG : SELLER_RESOURCES;
    const resourceIds = catalog.map((entry) => {
      const resource = resourceByOperation.get(`${entry.method} ${entry.path}`);
      if (!resource) throw new Error(`Missing seeded resource ${entry.method} ${entry.path}`);
      return resource.id;
    });
    const result = await reconcile.reconcileRole(role.id, resourceIds);
    changes += result.activated + result.deactivated;
  }
  return changes;
}