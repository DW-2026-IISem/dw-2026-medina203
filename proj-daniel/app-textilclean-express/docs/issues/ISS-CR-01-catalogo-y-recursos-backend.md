# ISS-CR-01 · Catálogo y operaciones del backend — TextilClean

**Depende de:** ISS-CR-00. **Habilita:** ISS-CR-02.

## Objetivo

Asegurar que cada casilla de la matriz corresponda a una operación **real** del
backend: una ruta existente, protegida con `authenticate` + `authorize`, con
su recurso único en `resources` y sembrada sin duplicados.

## Inspección (lo que ya había)

- Catálogo: `src/features/auth/resources/resource-catalog.ts` (69 operaciones).
- Rutas: cada feature registra las suyas con `...protect` (`features/access`).
- Seeder: `resources.seeder.ts` usa `findOrCreate` por `method + path`.
- BD: índice único `uq_resources_method_path`.

No se creó ninguna carpeta `features/crud`: las rutas de negocio siguen en
`features/business/*` con sus reglas de servicio (p. ej. una orden se crea con
sus líneas en una transacción y su total se recalcula; no hay un "insert
genérico" de órdenes).

## Cambios de este ISS

| Archivo | Cambio |
|---|---|
| `resources/resource-catalog.ts` | `findCatalogDuplicates()` y `assertUniqueCatalog()` (compara `METHOD + path normalizado`); descripción de `POST /api/concesiones-rol` actualizada. |
| `resources/resources.seeder.ts` | Falla con mensaje claro si el catálogo tiene duplicados; `findOrphanResources()` informa recursos activos que ya no están en el catálogo. |
| `database/seeders/catalog.ts` | **Nuevo** `npm run db:seed:catalog`: sincroniza solo `resources`, **no toca** `resource_roles`. |
| `database/seeders/index.ts` | `npm run db:seed -- --skip-grants` (o `SEED_SKIP_GRANTS=true`) omite la reconciliación de permisos. |

## Capacidades reales por entidad

✔ = ruta + regla de servicio + recurso sembrado. — = no existe (la matriz muestra "No disponible").

| Entidad (`/api/...`) | C `POST` | R `GET` (lista+detalle) | U `PUT`/`PATCH :id` | D `DELETE` | Acciones especiales |
|---|:-:|:-:|:-:|:-:|---|
| `clientes` | ✔ | ✔ | ✔ | ✔ | `deactivate` |
| `tipos-prenda` | ✔ | ✔ | ✔ | ✔ | `deactivate` |
| `servicios` | ✔ | ✔ | ✔ | ✔ | `deactivate` |
| `ordenes` | ✔ | ✔ | ✔ | ✔ | `estado`, `deactivate` |
| `detalle-ordenes` | ✔ | ✔ | ✔ | ✔ | `deactivate` |
| `usuarios` | ✔ | ✔ | ✔ | ✔ | `deactivate`, `password`, `permisos` |
| `roles` | ✔ | ✔ | ✔ | ✔ | `deactivate` |
| `recursos` | ✔ | ✔ | ✔ | ✔ | `deactivate` |
| `asignaciones-rol` | ✔ | ✔ | — | — | `deactivate`, `reactivate` |
| `concesiones-rol` | ✔ | ✔ | — | — | `deactivate`, `reactivate` |

Decisiones registradas:

- **`PUT` y `PATCH :id` son la misma columna** "Actualizar". Marcarla concede ambos.
- **Acciones especiales tienen permiso propio.** `PATCH /api/ordenes/:id/estado`
  lo tiene el operario sin poder editar la orden (`PATCH /api/ordenes/:id`).
- **Eliminar vs baja lógica:** `DELETE` es borrado físico (si el registro tiene
  dependientes, la llave foránea lo impide y la API responde `409`); `deactivate`
  es baja lógica y va en especiales.
- **No se habilitaron métodos solo para llenar la matriz:** asignaciones y
  concesiones no tienen `PUT`/`PATCH`/`DELETE` porque no tienen sentido en el dominio
  (se retiran y se reactivan).
- **Lecturas por propietario:** no aplica; TextilClean no tiene rutas que filtren
  por dueño (el perfil y "mis permisos" son JWT-only y no están en la matriz).

## Efecto de los seeders sobre concesiones personalizadas

| Comando | `resources` | `resource_roles` |
|---|---|---|
| `npm run db:seed` | sincroniza | **reconcilia ADMIN y OPERATOR a la matriz por defecto (sobrescribe ajustes manuales)** |
| `npm run db:seed -- --skip-grants` | sincroniza | sin cambios |
| `npm run db:seed:catalog` | sincroniza e informa huérfanos | sin cambios |

Comprobado en BD de pruebas: se desactivó a mano una concesión de OPERATOR, se
ejecutó `db:seed:catalog` y la concesión siguió inactiva; un recurso agregado a
mano fuera del catálogo se informó como huérfano y no se borró.

## Verificación

1. `npm run typecheck` ✔
2. Duplicados: `assertUniqueCatalog()` se ejecuta en cada siembra; la BD tiene índice único.
3. `npm run db:seed:catalog` dos veces → `0 creado(s), catálogo de 69` ✔
4. Sin token → `401`; operador en `GET /api/usuarios` → `403` (`npm run smoke`).

## Criterios de aceptación

- [x] Cada operación administrable tiene ruta y recurso coherentes.
- [x] Las rutas sensibles usan autenticación y autorización.
- [x] El servicio conserva sus reglas de negocio.
- [x] El catálogo evita duplicados y tiene descripciones entendibles.
- [x] Los efectos del seeder sobre concesiones personalizadas están descritos.
- [x] No se probó la eliminación sobre registros reales o protegidos.
