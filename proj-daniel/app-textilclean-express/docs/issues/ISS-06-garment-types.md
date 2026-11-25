# ISS-06 · Feature GarmentTypes (tipos de prenda) — TextilClean

**Bloqueado por:** ISS-05. **Habilita:** ISS-07.

## Objetivo

Catálogo de **tipos de prenda** que procesa la lavandería. Cada servicio
(ISS-07) pertenece a un tipo de prenda, porque el precio depende de ella
(no cuesta lo mismo lavar sábanas que batas médicas).

## Tabla `garment_types`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | INT PK | autoincremental |
| `name` | VARCHAR(80) | obligatorio, **único** |
| `description` | VARCHAR(255) | opcional |
| `status` | ENUM(`active`,`inactive`) | default `inactive`; la API crea en `active` |
| `createdAt`, `updatedAt` | DATETIME | automáticos |

## Endpoints (SIN AUTH) — `/api/tipos-prenda`

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/tipos-prenda` | Listar activos |
| GET | `/api/tipos-prenda/:id` | Obtener uno (404 si inactivo) |
| POST | `/api/tipos-prenda` | Crear (409 si el nombre existe) |
| PUT | `/api/tipos-prenda/:id` | Reemplazo (sin `status`) |
| PATCH | `/api/tipos-prenda/:id` | Parcial (`status` se ignora) |
| DELETE | `/api/tipos-prenda/:id` | Borrado físico |
| PATCH | `/api/tipos-prenda/:id/deactivate` | Borrado lógico |

## Seeder

Catálogo **determinista** de 10 prendas (sábanas, fundas, toallas, batas de baño,
manteles, servilletas, uniformes, batas médicas, cortinas, cobijas).
`--garment_types=N` toma las primeras N.

## Criterios de aceptación

- [x] Modelo, DTOs, repository, service, controller, routes
- [x] Archivos `.http` (get, create, update, delete)
- [x] Cableado en routes, config, swagger y seeders
- [x] Seeder con clave `garment_types` en `SeedCounts`
- [x] Swagger del feature
