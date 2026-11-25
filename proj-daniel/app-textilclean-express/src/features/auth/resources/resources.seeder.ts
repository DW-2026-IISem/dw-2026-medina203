import { normalizePath } from "../../../shared/auth/resource-match";
import { RESOURCE_CATALOG } from "./resource-catalog";
import { Resource } from "./resource.model";

/** Seeder de Resources: reconcilia la tabla con RESOURCE_CATALOG (crea, reactiva y actualiza descripción). */
export async function seedResources(): Promise<number> {
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