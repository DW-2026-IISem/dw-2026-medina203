import { fakerES_MX as faker } from "@faker-js/faker";
import { User } from "./user.model";

/**
 * Usuarios canónicos del laboratorio (credenciales SOLO para desarrollo):
 *   admin    / Admin123!     → rol ADMIN
 *   operador / Operador123!  → rol OPERATOR
 */
export const SEED_USERS = [
  { username: "admin", full_name: "Administrador TextilClean", email: "admin@textilclean.local", password: "Admin123!" },
  { username: "operador", full_name: "Operario de planta", email: "operador@textilclean.local", password: "Operador123!" },
] as const;

/**
 * Seeder de Users: crea (o reactiva) los canónicos y, si `count` es mayor,
 * agrega operarios falsos. Determinista para los canónicos.
 */
export async function seedUsers(count: number): Promise<number> {
  if (count <= 0) return 0;

  let created = 0;
  for (const item of SEED_USERS) {
    const [user, wasCreated] = await User.findOrCreate({
      where: { username: item.username },
      defaults: { ...item, avatar: null, status: "active" },
    });
    if (wasCreated) created += 1;
    else if (user.status !== "active") await user.update({ status: "active" });
  }

  // Completa hasta `count` usuarios en total (idempotente al re-ejecutar).
  const extras = Math.max(0, count - (await User.count()));
  for (let index = 0; index < extras; index += 1) {
    const username = `operario.${faker.string.alphanumeric(6)}`.toLowerCase();
    await User.create({
      username,
      full_name: faker.person.fullName(),
      email: `${username}@textilclean.local`,
      password: "Password123!",
      avatar: null,
      status: "active",
    });
    created += 1;
  }
  console.log(`✅ users: ${created} creado(s)`);
  return created;
}
