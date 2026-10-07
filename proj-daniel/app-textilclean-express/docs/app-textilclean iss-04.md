# 🛠 ISS-04 · Seeders con Faker — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase I:** Business (sin auth ni roles).
**Feature / tabla:** `clients` (seeder)
**API:** `npm run db:seed`
**Bloqueado por:** ISS-03 — Feature Client (CRUD por capas).
**Habilita:** ISS-06 — Feature ProductType.

**Objetivo:** datos falsos por feature (Faker) y un orquestador externo que ejecuta todos los seeders enviando la cantidad por entidad.

---

## Criterios de aceptación (ISS-04)

- [ ] 9.1 Existe `features/business/clients/clients.seeder.ts` con `@faker-js/faker`, recibe `count`, es idempotente
- [ ] 9.2 Existe `database/seeders/index.ts` (SeedersRunner) que llama seeders de features
- [ ] 9.2 Existe `database/seeders/counts.ts` con cantidad por entidad (default / env / CLI)
- [ ] Script `npm run db:seed` funciona
- [ ] Se puede variar cantidad: `npm run db:seed -- --clients=20` o `SEED_CLIENTS=5`

**Diseño:**

| Pieza | Ubicación | Rol |
|---|---|---|
| Seeder del feature | `src/features/business/clients/clients.seeder.ts` | Genera filas falsas de `Client` |
| Conteos | `src/database/seeders/counts.ts` | `clients: N` (y futuras entidades) |
| Runner | `src/database/seeders/index.ts` | Importa seeders de features y los ejecuta en orden |

> Los seeders son **scripts**, no la API. Viven fuera del recorrido HTTP → Controller → Service → Repository: se ejecutan por consola (`npm run db:seed`) y escriben con el modelo directamente. Por eso no usan los DTOs ni el service.

---

## 9.1 Seeder dentro del feature Client

Instala `@faker-js/faker` como dependencia de desarrollo.

```bash
npm install -D @faker-js/faker@^10.6.0
```

Crea el seeder `clients.seeder.ts` dentro del feature. Recibe `count`, es idempotente (si ya hay filas no duplica) y usa Faker para generar datos.

```bash
: > src/features/business/clients/clients.seeder.ts
cat >> src/features/business/clients/clients.seeder.ts << 'EOF'
import { faker } from "@faker-js/faker";
import { Client } from "./client.model";

/**
 * Seeder del feature Client (datos falsos con @faker-js/faker).
 * Se invoca desde `src/database/seeders` (SeedersRunner), no desde la App.
 *
 * Idempotente: si ya hay filas, no vuelve a insertar.
 */
export async function seedClients(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️  clients: count=0, se omite");
    return 0;
  }

  const existing = await Client.count();
  if (existing > 0) {
    console.log(`⏭️  clients: ya hay ${existing} registro(s), se omite seeder`);
    return 0;
  }

  const rows = Array.from({ length: count }, (_, i) => ({
    name: faker.person.fullName(),
    address: faker.location.streetAddress(),
    phone: faker.phone.number({ style: "national" }),
    email: `client.${i}.${faker.string.alphanumeric(6)}@example.com`.toLowerCase(),
    password: "Password123!",
    status: "active" as const,
  }));

  await Client.bulkCreate(rows);
  console.log(`✅ clients: insertados ${count} registro(s) falsos`);
  return count;
}
EOF
```

---

## 9.2 SeedersRunner + conteos por entidad (database/seeders)

### 9.2.1 Conteos

Crea `src/database/seeders/counts.ts` con la cantidad por entidad (default / env / CLI).

```bash
: > src/database/seeders/counts.ts
cat >> src/database/seeders/counts.ts << 'EOF'
/**
 * Cantidad de registros por feature/entidad.
 * Prioridad: CLI (--clients=N) > env (SEED_CLIENTS) > default de este archivo.
 *
 * Cuando agregues features, suma aquí la clave y léela en el runner.
 */
export type SeedCounts = {
  clients: number;
  // users?: number;
  // roles?: number;
  // products?: number;
};

export const DEFAULT_SEED_COUNTS: SeedCounts = {
  clients: 10,
};

export function resolveSeedCounts(argv: string[] = process.argv.slice(2)): SeedCounts {
  const counts: SeedCounts = { ...DEFAULT_SEED_COUNTS };

  const envClients = process.env.SEED_CLIENTS;
  if (envClients !== undefined && envClients !== "") {
    counts.clients = Number(envClients);
  }

  for (const arg of argv) {
    const m = arg.match(/^--([a-zA-Z_]+)=(\d+)$/);
    if (!m) continue;
    const key = m[1] as keyof SeedCounts;
    const value = Number(m[2]);
    if (key in counts) {
      counts[key] = value;
    }
  }

  return counts;
}
EOF
```

### 9.2.2 Runner

Crea `src/database/seeders/index.ts` con el `SeedersRunner` que ejecuta todos los seeders de features.

```bash
: > src/database/seeders/index.ts
cat >> src/database/seeders/index.ts << 'EOF'
import dotenv from "dotenv";
import { sequelize, testConnection } from "../db";
import "../../features/business/clients/client.model";
import { seedClients } from "../../features/business/clients/client.seeder";
import { resolveSeedCounts } from "./counts";

dotenv.config();

/**
 * SeedersRunner — ejecuta TODOS los seeders de features.
 *
 * Ubicación: `src/database/seeders/` (orquestación fuera de cada feature).
 * Cada feature exporta su seeder (ej. `features/business/clients/clients.seeder.ts`).
 *
 * Uso:
 *   npm run db:seed
 *   npm run db:seed -- --clients=20
 *   SEED_CLIENTS=5 npm run db:seed
 */
export async function runAllSeeders(): Promise<void> {
  const counts = resolveSeedCounts();
  console.log("🌱 Iniciando SeedersRunner...");
  console.log("📊 Conteos:", counts);

  const ok = await testConnection();
  if (!ok) {
    throw new Error("No hay conexión a la base de datos");
  }

  await sequelize.sync({ force: false, alter: true });

  // Orden: business (padres → hijos)
  await seedClients(counts.clients);

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
EOF
```

**PARCHE — `package.json` ya existe.**

Dentro de `"scripts"`, debajo de `"dev": "..."`, añadir la coma al final de `dev` (si falta) y la clave:

```json
    "db:seed": "ts-node -- src/database/seeders/index.ts"
```

Fragmento esperado:

```json
  "scripts": {
    "build": "tsc",
    "dev": "nodemon --watch src --ext ts --exec ts-node -- src/server.ts",
    "db:seed": "ts-node -- src/database/seeders/index.ts"
  }
```

---

## Verificación ISS-04

Ejecuta los seeders con los tres modos posibles (default, CLI y env).

```bash
npm run db:seed
npm run db:seed -- --clients=20
SEED_CLIENTS=5 npm run db:seed
```

> **Nota:** como el seeder es idempotente, la segunda y tercera ejecución imprimirán `⏭️ clients: ya hay N registro(s), se omite seeder`. Eso confirma que funciona correctamente.

### Al agregar otra entidad (patrón a seguir)

1. Archivo nuevo `features/.../<plural>.seeder.ts` con `: >` + `cat >>`.
2. PARCHE `counts.ts`: dentro de `SeedCounts` / defaults, añadir clave (ej. `products: 10`).
3. PARCHE `database/seeders/index.ts`: debajo de `await seedClients(...)`, añadir la llamada al nuevo seeder.

---

## Cierre del ISS

Levanta el servidor en modo desarrollo. Debe arrancar sin error. Detenerlo con `Ctrl+C` antes de continuar.

```bash
npm run dev
```

---

## ✅ GATE de la unidad ISS-04

Las condiciones de cierre son exactamente las que define el ISS técnico de esta misma página:

- 📋 Criterios de aceptación → **Criterios de aceptación**
- 🧩 Cierre de la unidad → **Cierre del ISS**
- 🧠 Autoevaluación → Evaluación del cuaderno

Con el GATE en verde queda habilitado **ISS-05 · Swagger / OpenAPI**.

---

**Navegación de la ruta:** ← ISS-04 · 🧠 Aprender · ↑ Ruta Express · → ISS-05 · 🧠 Aprender