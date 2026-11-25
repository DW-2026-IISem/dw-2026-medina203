import { Role } from "./role.model";

/** Roles de TextilClean. */
export const SEED_ROLES = [
  { name: "ADMIN", description: "Administración: catálogos, precios, anulaciones, usuarios y permisos" },
  { name: "OPERATOR", description: "Operario de planta: registra clientes y órdenes y avanza su proceso" },
] as const;

/** Seeder de Roles: crea o reactiva los roles base. Determinista. */
export async function seedRoles(): Promise<number> {
  let created = 0;
  for (const item of SEED_ROLES) {
    const [role, wasCreated] = await Role.findOrCreate({
      where: { name: item.name },
      defaults: { ...item, status: "active" },
    });
    if (wasCreated) created += 1;
    else if (role.status !== "active") await role.update({ status: "active" });
  }
  console.log(`✅ roles: ${created} creado(s)`);
  return created;
}
