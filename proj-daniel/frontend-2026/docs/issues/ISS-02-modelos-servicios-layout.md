# ISS-02 · Modelos, servicios de API y layout — TextilClean

**Bloqueado por:** ISS-01. **Habilita:** ISS-03.

## Objetivo

Preparar la capa de datos (modelos y servicios HTTP alineados con
`app-textilclean-express`) y el layout de la aplicación.

## Entornos

`src/environments/environment*.ts`: `apiUrl: 'http://localhost:4000/api'` (sin slash final),
`requireAuth` (se usa desde ISS-08) y `primeUiLicense`. `angular.json` reemplaza el de
producción por el de desarrollo en `ng serve` y `ng test`.

## Modelos (`core/models`)

| Archivo | Tabla / endpoint | Interfaces |
|---|---|---|
| `api.model.ts` | — | `Status`, `Money`, `ApiError`, `Timestamps` |
| `customer.model.ts` | `customers` · `/clientes` | `Customer`, payloads de creación y actualización |
| `garment-type.model.ts` | `garment_types` · `/tipos-prenda` | `GarmentType`, payloads |
| `laundry-service.model.ts` | `laundry_services` · `/servicios` | `LaundryService`, `BillingUnit` (`kg`/`unit`) |
| `service-order.model.ts` | `service_orders` · `/ordenes` | `ServiceOrder`, `ProcessStatus` + etiquetas y siguiente estado |
| `service-order-item.model.ts` | `service_order_items` · `/detalle-ordenes` | `ServiceOrderItem`, payloads |
| `user`, `role`, `resource`, `role-user`, `resource-role`, `auth` | Seguridad RBAC | Usuarios (con `full_name`), roles, recursos, pivotes, tokens y permisos |

## Servicios de API

Uno por endpoint; desenvuelven la respuesta de Express (`{ customers }` → `Customer[]`):
`CustomerApi`, `GarmentTypeApi`, `LaundryServiceApi`, `ServiceOrderApi` (filtros y
`changeStatus`), `ServiceOrderItemApi`, `UserApi`, `RoleApi`, `ResourceApi`,
`RoleUserApi`, `ResourceRoleApi`.

## Layout

`Shell` (Header + Aside + `router-outlet` + Footer, Drawer en móvil, Toast y ConfirmDialog),
menú declarado en `layout/shell/nav.config.ts`, componentes compartidos `PageHeader`,
`EmptyState` y `StatusTag`, y utilidades `toApiMessage`, `filterRows`, `watchMediaQuery`
y `toNumber`. Página de inicio provisional en `/inicio`.

## Verificación

```bash
npm run build
npm test      # 35 pruebas: contratos de API, utilidades, App y Shell
```

## Criterios de aceptación

- [x] Modelos con los nombres reales de tablas y columnas del backend
- [x] Servicios de API con URL, método y envoltura verificados en pruebas
- [x] Layout responsive con menú configurable
