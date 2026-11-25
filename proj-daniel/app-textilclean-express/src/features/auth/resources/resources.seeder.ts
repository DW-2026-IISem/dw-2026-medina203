import { normalizePath } from "../../../shared/auth/resource-match";
import { assertUniqueCatalog, RESOURCE_CATALOG } from "./resource-catalog";
import { Resource } from "./resource.model";

/**
 * Seeder de Resources: reconcilia la tabla con RESOURCE_CATALOG (crea, reactiva y
 * actualiza descripción). Es idempotente: `findOrCreate` por `method + path`.
 * NO toca `resource_roles`: las concesiones son responsabilidad de otro seeder.
 */
export async function seedResources(): Promise<number> {
  assertUniqueCatalog();
  let created = 0;
  for (const entry of RESOURCE_CATALOG) {
    const method = entry.method.toUpperCase();
    const path = normalizePath(entry.path);
    const [resource, wasCreated] = await Resource.findOrCreate({
      where: { method, path },
      defaults: { method, path, description: entry.description, status: "active" },
    });
    if (wasCreated) created += 1;
    else if (resource.status !== "active" || resource.description !== entry.description) {
      await resource.update({ status: "active", description: entry.description });
    }
  }
  console.log(`✅ resources: ${created} creado(s), catálogo de ${RESOURCE_CATALOG.length}`);
  return created;
}

/** Recursos activos en BD que ya no están en el catálogo (se informan, no se borran). */
export async function findOrphanResources(): Promise<string[]> {
  const catalog = new Set(RESOURCE_CATALOG.map((entry) => `${entry.method.toUpperCase()} ${normalizePath(entry.path)}`));
  const rows = await Resource.findAll({ where: { status: "active" }, order: [["id", "ASC"]] });
  return rows.map((row) => `${row.method} ${row.path}`).filter((key) => !catalog.has(key));
}
