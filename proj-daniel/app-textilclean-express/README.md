# app-textilclean-express

Backend de **TextilClean — Lavandería industrial** (proyecto 16, Desarrollo Web 2026-II).

Express 5 + TypeScript + Sequelize 6, organizado por *features* y por capas
(`routes → controller → service → repository → model`), siguiendo la secuencia de
issues de la guía Backend-2026 Express, pero con el **dominio propio de TextilClean**.

## Dominio

TextilClean presta servicios de lavado industrial a empresas (hoteles, clínicas,
restaurantes, gimnasios). Una empresa cliente entrega prendas, se registra una
**orden de servicio** con sus líneas (qué servicio y cuánta ropa) y la orden avanza
por un proceso hasta ser entregada.

| Tabla | Qué guarda |
|---|---|
| `customers` | Empresas cliente: razón social, NIT, contacto, teléfono, correo, dirección |
| `garment_types` | Tipos de prenda: sábanas, toallas, uniformes, manteles… |
| `laundry_services` | Servicios ofrecidos por tipo de prenda: precio y unidad de cobro (`kg` o `unit`) |
| `service_orders` | Órdenes de servicio: cliente, fechas, estado del proceso y totales |
| `service_order_items` | Líneas de cada orden: servicio, cantidad, peso, precio congelado y total de línea |

Fase II (seguridad) añade `users`, `roles`, `resources`, `role_users`,
`resource_roles` y `refresh_tokens`.

## Requisitos

Ver [docs/issues/ISS-00-requisitos.md](docs/issues/ISS-00-requisitos.md).

## Arranque rápido

```bash
npm install
cp .env.example .env      # ajustar credenciales de MySQL
npm run dev               # crea/sincroniza tablas y levanta el API
npm run db:seed           # datos de prueba
```

Swagger: `http://localhost:4000/api/docs`

## Issues

La trazabilidad de cada issue está en `docs/issues/`. Cada issue corresponde a un commit.
