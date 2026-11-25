# Cierre Fase I · Business (sin auth) — TextilClean

Estado consolidado del backend al terminar ISS-00 … ISS-08.

## Modelo de datos (5 tablas)

```mermaid
erDiagram
    customers ||--o{ service_orders : "entrega"
    garment_types ||--o{ laundry_services : "clasifica"
    service_orders ||--|{ service_order_items : "contiene"
    laundry_services ||--o{ service_order_items : "se cobra en"

    customers {
        int id PK
        varchar business_name
        varchar tax_id UK "NIT"
        varchar contact_name
        varchar phone
        varchar email UK
        varchar address
        enum status
    }
    garment_types {
        int id PK
        varchar name UK
        varchar description
        enum status
    }
    laundry_services {
        int id PK
        varchar name
        decimal price
        enum billing_unit "kg | unit"
        int estimated_hours
        int garment_type_id FK
        enum status
    }
    service_orders {
        int id PK
        int customer_id FK
        datetime received_at
        datetime delivery_date
        enum process_status "received | in_process | ready | delivered"
        decimal subtotal
        decimal tax
        decimal discount
        decimal total
        enum status
    }
    service_order_items {
        int id PK
        int service_order_id FK
        int laundry_service_id FK
        int quantity
        decimal weight_kg
        decimal unit_price
        decimal line_total
        enum status
    }
```

## Features de negocio

| Feature | Ruta | Operaciones |
|---|---|---|
| customers | `/api/clientes` | CRUD + deactivate |
| garment-types | `/api/tipos-prenda` | CRUD + deactivate |
| laundry-services | `/api/servicios` | CRUD + deactivate |
| service-orders | `/api/ordenes` | CRUD + `estado` + deactivate (anular) |
| service-order-items | `/api/detalle-ordenes` | CRUD + deactivate |

Todos siguen `routes → controller → service → repository → model`.

## Verificación de cierre

```bash
npm run typecheck                      # sin errores
DB_SYNC_FORCE=true npm run dev         # recrea las 5 tablas (luego volver a false)
npm run db:seed                        # 10 clientes, 10 prendas, 20 servicios, 15 órdenes
# Swagger: http://localhost:4000/api/docs → 36 operaciones
```

Recorrido manual sugerido (archivos `.http`):

1. Crear un cliente (`customers.create.http`).
2. Consultar servicios (`laundry-services.get.http`) y elegir uno por kg y otro por unidad.
3. Crear una orden con ambas líneas (`service-orders.create.http`) y revisar los totales.
4. Agregar y editar líneas (`service-order-items.*.http`): el total de la orden cambia.
5. Avanzar el estado hasta `delivered` y comprobar que ya no se puede modificar (409).

## Criterios de cierre

- [x] 5 features de negocio con las capas completas
- [x] 5 tablas propias del dominio de lavandería (ninguna de la tienda de la guía)
- [x] Seeders deterministas/idempotentes y Swagger completo
- [x] `npx tsc --noEmit` sin errores
