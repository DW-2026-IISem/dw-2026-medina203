# app-textilclean-express

Backend de **TextilClean — Lavandería industrial** (proyecto 16, Desarrollo Web 2026-II).

Express 5 + TypeScript + Sequelize 6, organizado por *features* y por capas
(`routes → controller → service → repository → model`), siguiendo la secuencia de
issues de la guía Backend-2026 Express pero con el **dominio propio de TextilClean**.

## Dominio

TextilClean presta servicios de lavado industrial a empresas (hoteles, clínicas,
restaurantes, gimnasios). La empresa cliente entrega sus prendas, se registra una
**orden de servicio** con sus líneas (qué servicio y cuánta ropa) y la orden avanza
por el proceso `recibida → en proceso → lista → entregada`.

| Tabla | Qué guarda |
|---|---|
| `customers` | Empresas cliente: razón social, NIT, contacto, teléfono, correo, dirección |
| `garment_types` | Tipos de prenda: sábanas, toallas, uniformes, manteles… |
| `laundry_services` | Servicios por tipo de prenda: precio y unidad de cobro (`kg` o `unit`) |
| `service_orders` | Órdenes: cliente, fechas, estado del proceso y totales |
| `service_order_items` | Líneas: servicio, cantidad, peso, precio congelado y total de línea |
| `users`, `roles`, `resources`, `role_users`, `resource_roles`, `refresh_tokens` | Seguridad RBAC y sesiones |

## Arranque

Requisitos: Node 22+, MySQL 8 (o PostgreSQL) y la base `textilclean_db` creada.

```bash
npm install
cp .env.example .env       # credenciales de MySQL y JWT_SECRET
npm run dev                # crea/sincroniza las 11 tablas y levanta el API en :4000
npm run db:seed            # datos de prueba + roles, permisos y usuarios
npm run smoke              # (con el servidor arriba) prueba E2E
```

- Swagger: <http://localhost:4000/api/docs>
- Usuarios: `admin / Admin123!` (ADMIN) · `operador / Operador123!` (OPERATOR)
- Archivos `.http` (REST Client) en `src/features/**/http/`; empieza por
  `src/features/auth/session/http/session.http` para obtener el token.

## Scripts

| Script | Uso |
|---|---|
| `npm run dev` | Servidor con recarga |
| `npm run build` / `npm start` | Compilar a `dist/` y ejecutar |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:seed` | SeedersRunner (`-- --customers=20`, `SEED_SERVICE_ORDERS=30`…) |
| `npm run dev:token -- admin` | Access token de desarrollo para un usuario |
| `npm run smoke` | Smoke test E2E de las 3 modalidades y el flujo de una orden |

## Rutas principales

| Recurso | Ruta |
|---|---|
| Sesión | `POST /api/sesion/login` · `/refresh` · `/logout` · `GET /api/sesion/perfil` · `GET /api/permisos` |
| Clientes | `/api/clientes` |
| Tipos de prenda | `/api/tipos-prenda` |
| Servicios | `/api/servicios` |
| Órdenes | `/api/ordenes` · `PATCH /api/ordenes/:id/estado` |
| Detalle de órdenes | `/api/detalle-ordenes` |
| Seguridad | `/api/usuarios` · `/api/roles` · `/api/recursos` · `/api/asignaciones-rol` · `/api/concesiones-rol` · `/api/sesiones` |

## Issues

Cada issue es un commit; su trazabilidad está en [`docs/issues/`](docs/issues/):
ISS-00 … ISS-08 + [cierre Fase I](docs/issues/CIERRE-BUSINESS.md), ISS-09 … ISS-15 +
[cierre Fase II](docs/issues/CIERRE-AUTH.md).
