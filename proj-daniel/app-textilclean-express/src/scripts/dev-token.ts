import dotenv from "dotenv";
import { sequelize } from "../database/db";
import "../features/auth/users/user.model";
import { User } from "../features/auth/users/user.model";
import { signAccessToken } from "../shared/auth/jwt";

dotenv.config({ quiet: true });

/**
 * Utilidad de DESARROLLO: firma un access token para un usuario existente,
 * para probar las rutas protegidas antes de tener el login (ISS-15).
 *
 *   npm run dev:token -- admin
 *   npm run dev:token -- operador
 */
async function main(): Promise<void> {
  const username = (process.argv[2] ?? "admin").toLowerCase();
  const user = await User.findOne({ where: { username, status: "active" } });
  if (!user) throw new Error(`Usuario activo '${username}' no encontrado (¿ejecutaste npm run db:seed?)`);
  const { token, expiresIn } = signAccessToken({ id: user.id, username: user.username });
  console.log(`# ${user.username} (expira en ${expiresIn}s)`);
  console.log(token);
}

main()
  .catch((error) => {
    console.error("❌", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
