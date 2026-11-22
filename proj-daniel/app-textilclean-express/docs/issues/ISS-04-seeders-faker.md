# ISS-04 · Seeders con Faker — TextilClean

**Bloqueado por:** ISS-03. **Habilita:** ISS-05.

## Objetivo

Poblar la base con datos de prueba realistas para una lavandería industrial.

## Comandos

```bash
npm install -D @faker-js/faker
npm run db:seed                       # 10 clientes por defecto
npm run db:seed -- --customers=20     # por CLI
SEED_CUSTOMERS=5 npm run db:seed      # por variable de entorno
```

## Diseño

| Archivo | Responsabilidad |
|---|---|
| `src/database/seeders/index.ts` | **SeedersRunner**: conecta, sincroniza y ejecuta los seeders padres → hijos |
| `src/database/seeders/counts.ts` | `SeedCounts`: prioridad CLI > `SEED_*` > default |
| `features/business/customers/customers.seeder.ts` | Clientes falsos del dominio |

- Faker con locale **es_MX** (nombres y direcciones en español).
- Clientes de sectores que contratan lavandería: hoteles, clínicas, restaurantes,
  gimnasios, spas… con NIT aleatorio `#########-#`.
- **Idempotente**: si la tabla ya tiene filas, el seeder se omite.
- Cada seeder vive en su feature; el runner solo orquesta.

## Criterios de aceptación

- [x] Script `db:seed` en `package.json`
- [x] `SeedCounts` con la clave `customers`
- [x] Seeder de customers idempotente
- [x] `npm run db:seed` inserta los registros
