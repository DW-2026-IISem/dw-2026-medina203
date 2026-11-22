# ISS-08 · Feature ServiceOrders + ServiceOrderItems — TextilClean

**Bloqueado por:** ISS-07 (LaundryServices) e ISS-03 (Customers). **Habilita:** Cierre Fase I.

## Objetivo

Registrar las **órdenes de servicio** que entregan las empresas cliente, con sus
líneas, de forma **transaccional**: la orden, sus líneas y sus totales se guardan
juntos o no se guarda nada.

## Tabla `service_orders`

| Campo | Tipo | Regla |
|---|---|---|
| `customer_id` | INT FK → `customers` | cliente activo |
| `received_at` | DATETIME | default ahora |
| `delivery_date` | DATETIME NULL | default `received_at` + mayor `estimated_hours`; al entregar toma la fecha real |
| `process_status` | ENUM | `received` → `in_process` → `ready` → `delivered` |
| `notes` | VARCHAR(500) | opcional |
| `subtotal`, `tax`, `discount`, `total` | DECIMAL(12,2) | `total = subtotal + tax − discount` |
| `status` | ENUM(`active`,`inactive`) | borrado lógico (= anulación) |

## Tabla `service_order_items`

| Campo | Tipo | Regla |
|---|---|---|
| `service_order_id` | INT FK → `service_orders` | |
| `laundry_service_id` | INT FK → `laundry_services` | servicio activo |
| `quantity` | INT | ≥ 1 (número de prendas) |
| `weight_kg` | DECIMAL(10,2) NULL | > 0; **obligatorio** si el servicio cobra por kg |
| `unit_price` | DECIMAL(12,2) | **copia** del precio del servicio al crear la línea |
| `line_total` | DECIMAL(12,2) | `unit_price × weight_kg` (kg) o `unit_price × quantity` (unit) |
| `status` | ENUM(`active`,`inactive`) | |

## Relaciones

- `Customer 1:N ServiceOrder` (`service-orders.associations.ts`, alias `customer`)
- `ServiceOrder 1:N ServiceOrderItem` (alias `items`)
- `LaundryService 1:N ServiceOrderItem` (alias `laundry_service`)

## Reglas de negocio

- **Crear orden** (`POST /api/ordenes`): cliente activo (404), ≥ 1 línea (400), servicios
  activos (404/400), peso obligatorio en servicios por kg (400), descuento ≤ subtotal + impuesto (400).
  Todo en **una transacción**.
- **Totales**: cada cambio en líneas recalcula `subtotal` con las líneas activas y `total`
  (`order-totals.ts`, compartido por ambos features).
- **Precio congelado**: cambiar el precio de un servicio no altera órdenes existentes; editar
  la cantidad o el peso de una línea usa el `unit_price` guardado.
- **Estado del proceso** (`PATCH /api/ordenes/:id/estado`): solo un paso hacia adelante (409 si no);
  requiere al menos una línea activa.
- **Orden entregada**: no admite cambios en datos, líneas ni anulación (**409**).
- **Anular** (`/deactivate`): orden y líneas pasan a `inactive`.
- **Borrado físico**: elimina líneas y orden (también purga órdenes anuladas).
- **Candados**: siempre `service_orders` → `laundry_services` → `service_order_items`
  (`SELECT … FOR UPDATE`), para evitar *deadlocks* en InnoDB.

## Endpoints (SIN AUTH)

**`/api/ordenes`**: GET (filtros `?customer_id=` y `?process_status=`), GET `:id` (con cliente y
líneas), POST, PUT, PATCH, DELETE, PATCH `:id/estado`, PATCH `:id/deactivate`.

**`/api/detalle-ordenes`**: GET (filtro `?service_order_id=`), GET `:id`, POST, PUT, PATCH
(cantidad/peso), DELETE, PATCH `:id/deactivate`.

## Seeders

`service_orders` (15) se crea **con el service** (misma transacción y cálculo que la API), con
1-3 líneas y avance aleatorio del proceso. Después, `service_order_items` (10) agrega líneas
a órdenes aún no entregadas.

## Criterios de aceptación

- [x] Modelos `ServiceOrder` y `ServiceOrderItem` con relaciones
- [x] DTOs, repository, service y controller de ambos features
- [x] Creación transaccional con validación de cliente, servicios, peso y descuento
- [x] Recalculo de totales en cada cambio de línea
- [x] Máquina de estados del proceso
- [x] Rutas y `.http` de `/api/ordenes` y `/api/detalle-ordenes`
- [x] Seeders (`service_orders` antes que `service_order_items`) y claves en `SeedCounts`
- [x] Swagger de ambos features
