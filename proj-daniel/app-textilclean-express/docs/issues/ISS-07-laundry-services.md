# ISS-07 · Feature LaundryServices (servicios) — TextilClean

**Bloqueado por:** ISS-06. **Habilita:** ISS-08.

## Objetivo

Catálogo de **servicios** que vende la lavandería. Cada servicio pertenece a un
tipo de prenda y define cómo se cobra.

## Tabla `laundry_services`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | INT PK | autoincremental |
| `name` | VARCHAR(120) | obligatorio (ej. "Lavado y secado - Sábanas") |
| `description` | VARCHAR(255) | opcional |
| `price` | DECIMAL(12,2) | obligatorio, ≥ 0 (COP) |
| `billing_unit` | ENUM(`kg`,`unit`) | `kg` = precio × peso; `unit` = precio × cantidad |
| `estimated_hours` | INT | ≥ 1, default 24 (tiempo de entrega) |
| `garment_type_id` | INT FK → `garment_types.id` | obligatorio |
| `status` | ENUM(`active`,`inactive`) | default `inactive`; la API crea en `active` |

> Diferencia con la guía: no hay `stock` ni `min_stock`, porque un servicio no se
> agota. En su lugar están `billing_unit` y `estimated_hours`.

## Relación

`laundry-services.associations.ts`:

- `LaundryService.belongsTo(GarmentType)` → alias `garment_type`
- `GarmentType.hasMany(LaundryService)` → alias `laundry_services`

Las lecturas incluyen `garment_type: { id, name }`.

## Reglas de negocio

1. En create, PUT y PATCH (si llega `garment_type_id`), el tipo de prenda debe
   existir (**404** "Garment type not found") y estar activo (**400** "Garment type must be active").
2. `status` solo cambia con el borrado lógico; PATCH lo ignora.
3. Create copia los campos uno a uno (anti *mass assignment*).
4. `findByIdForUpdate` (`SELECT … FOR UPDATE`) queda listo para ISS-08.

## Endpoints (SIN AUTH) — `/api/servicios`

GET, GET `:id`, POST, PUT, PATCH, DELETE físico y PATCH `:id/deactivate`.

## Seeder

Combina los tipos de prenda activos con 5 plantillas (lavado y secado, lavado con
desinfección, planchado, desmanchado, lavado en seco), con precios en COP.
Clave `laundry_services` (default 20).

## Criterios de aceptación

- [x] Modelo con `garment_type_id` y relación declarada
- [x] Service valida tipo de prenda activo usando `GarmentTypesRepository`
- [x] Rutas y `.http` en orden: getAll, getOne, create, update, delete físico y lógico
- [x] Cableado en routes, config, swagger y seeders
- [x] Seeder y Swagger
