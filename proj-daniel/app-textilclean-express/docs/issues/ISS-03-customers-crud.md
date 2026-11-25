# ISS-03 · Feature Customers (CRUD por capas) — TextilClean

**Bloqueado por:** ISS-02. **Habilita:** ISS-04.

## Objetivo

Primer feature completo: las **empresas cliente** de la lavandería, con la
arquitectura por capas que reutilizarán los demás features.

```
HTTP → Controller → Service → Repository → Model → Sequelize → BD
```

## Tabla `customers`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | INT PK | autoincremental |
| `business_name` | VARCHAR(150) | obligatorio (razón social) |
| `tax_id` | VARCHAR(20) | obligatorio, **único**, formato NIT (`900123456-7`) |
| `contact_name` | VARCHAR(120) | opcional (persona de contacto) |
| `phone` | VARCHAR(30) | obligatorio |
| `email` | VARCHAR(150) | obligatorio, **único**, email válido |
| `address` | VARCHAR(200) | opcional |
| `status` | ENUM(`active`,`inactive`) | default del modelo `inactive`; la API crea en `active` |
| `createdAt`, `updatedAt` | DATETIME | automáticos |

> A diferencia de la guía, el cliente **no tiene contraseña**: es una empresa a la
> que se le presta el servicio, no un usuario del sistema. Los usuarios llegan en la Fase II.

## Estructura

```
src/shared/
├── errors/app-error.ts           # AppError(statusCode, message)
├── http/base-controller.ts       # run(), paramId(), handleError()
├── http/error-response.ts        # AppError / Sequelize → 400, 404, 409, 500
├── http/pick-fields.ts           # whitelist de campos (anti mass assignment)
└── database/with-transaction.ts  # unit of work (se usa en ISS-08)
src/features/business/customers/
├── customer.model.ts
├── dto/ (create, update, patch, response, index)
├── customers.repository.ts
├── customers.service.ts
├── customers.controller.ts
├── customers.routes.ts
└── http/ (get, create, update, delete)
```

## Endpoints (SIN AUTH)

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/clientes` | 200 `{ customers }` solo activos |
| GET | `/api/clientes/:id` | 200 · 400 id inválido · 404 |
| POST | `/api/clientes` | 201 · 400 validación · 409 NIT/correo repetido |
| PUT | `/api/clientes/:id` | 200 reemplazo (sin `status`) |
| PATCH | `/api/clientes/:id` | 200 parcial; `status` se ignora |
| DELETE | `/api/clientes/:id` | 200 borrado físico |
| PATCH | `/api/clientes/:id/deactivate` | 200 borrado lógico |

## Criterios de aceptación

- [x] Capa `shared/` creada
- [x] Modelo con `status` y `timestamps: true`; tabla `customers` creada por `sync`
- [x] DTOs, repository, service, controller y routes
- [x] Archivos `.http` para probar cada operación
- [x] Cableado en `routes/index.ts` y `config/index.ts`
- [x] PATCH filtra `status` en tiempo de ejecución (no solo en tipos)
- [x] `npx tsc --noEmit` sin errores
