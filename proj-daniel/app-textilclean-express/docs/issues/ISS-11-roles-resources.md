# ISS-11 · Features Roles y Resources — TextilClean

**Bloqueado por:** ISS-10. **Habilita:** ISS-12.

## Objetivo

Administrar los **roles** y el **catálogo de recursos** (operaciones HTTP
protegibles) de TextilClean.

## Roles de TextilClean

| Rol | Quién | Qué puede hacer (ISS-12) |
|---|---|---|
| `ADMIN` | Administrador | Todo el catálogo (69 operaciones) |
| `OPERATOR` | Operario de planta | 17 operaciones: consultar clientes, prendas y servicios; registrar clientes y órdenes; agregar/editar líneas; avanzar el estado del proceso |

El operario **no** puede borrar, anular órdenes, cambiar precios ni administrar la seguridad.

## Catálogo (`resources/resource-catalog.ts`)

Una entrada por operación `METHOD /ruta` (con `:params`). Es la fuente de verdad del
seeder de recursos y de las concesiones de cada rol.

| Grupo | Operaciones |
|---|---|
| Clientes, tipos de prenda, servicios, detalle de órdenes | 7 c/u |
| Órdenes (incluye `/estado`) | 8 |
| Usuarios (incluye `/password` y `/permisos`) | 9 |
| Roles, recursos | 7 c/u |
| Asignaciones y concesiones de rol | 5 c/u |
| **Total** | **69** |

## Endpoints (sin middlewares hasta ISS-13)

- `/api/roles`: GET, GET `:id`, POST, PUT, PATCH, DELETE, PATCH `:id/deactivate`.
  El nombre se guarda en MAYÚSCULAS y es único (409).
- `/api/recursos`: GET, GET `:id`, POST, PUT, PATCH, DELETE, PATCH `:id/deactivate`.
  `method` ∈ GET/POST/PUT/PATCH/DELETE; `path` empieza en `/` y se normaliza
  (sin `/` final); el par es único (409).

## Seeders

Orden de seguridad: `roles → resources → users`, antes del negocio.

- `seedRoles()`: crea/reactiva ADMIN y OPERATOR.
- `seedResources()`: reconcilia la tabla con el catálogo (crea, reactiva y actualiza descripción).

## Criterios de aceptación

- [x] Features roles y resources con todas las capas, Swagger y `.http`
- [x] Catálogo de 69 operaciones propio de TextilClean, con marca `operator`
- [x] Seeders deterministas de roles y recursos
