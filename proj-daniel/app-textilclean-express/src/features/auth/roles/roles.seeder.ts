import { Role } from "./role.model";

export const SEED_ROLES = [
  { name: "ADMIN", description: "Administración del sistema: gestiona usuarios, roles y permisos" },
  { name: "SELLER", description: "Operación de ventas: consulta catálogo y registra ventas" },
] as const;

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
  return created;
}