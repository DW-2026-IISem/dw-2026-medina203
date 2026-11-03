# ISS-02 · Modelos, servicios y layout — Registro de verificación

**Fecha:** 01–02-nov-2026
**Proyecto:** `front-textilclean-express` (carpeta `frontend-2026`)
**Ruta:** `~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026`
**Estado:** ✅ Código, build, pruebas y capturas OK

---

## 2.1 · Entornos y `fileReplacements`

```ts
// src/environments/environment.ts (producción)
export const environment = {
  production: true,
  appName: 'TextilClean Express',
  apiUrl: 'http://localhost:3000/api',
  requireAuth: true,
  primeUiLicense: '',
};
```

```ts
// src/environments/environment.development.ts
export const environment = {
  production: false,
  appName: 'TextilClean Express',
  apiUrl: 'http://localhost:3000/api',
  requireAuth: true,
  primeUiLicense: '',
};
```

`angular.json` → `build.configurations.development.fileReplacements`:

```json
[
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.development.ts"
  }
]
```

✅ `apiUrl` sin slash final · ✅ `ng serve`/`ng test` usan el archivo de
desarrollo · ✅ `ng build` usa el de producción.

## 2.2 · Modelos (13 archivos)

| #   | Archivo                  | Interfaces                                                        |
| --- | ------------------------ | ----------------------------------------------------------------- |
| 1   | `api.model.ts`           | `Status`, `Money`, `ApiError`, `Timestamps`, `toNumber()`         |
| 2   | `client.model.ts`        | `Client`, `ClientPayload`                                         |
| 3   | `product-type.model.ts`  | `ProductType`, `ProductTypePayload`                               |
| 4   | `product.model.ts`       | `Product`, `ProductPayload`                                       |
| 5   | `sale.model.ts`          | `Sale`, `SaleItemInput`, `SaleCreatePayload`, `SaleUpdatePayload` |
| 6   | `product-sale.model.ts`  | `ProductSale`, `ProductSalePayload`                               |
| 7   | `user.model.ts`          | `User`, `UserPayload`                                             |
| 8   | `role.model.ts`          | `Role`, `RolePayload`                                             |
| 9   | `resource.model.ts`      | `HttpMethod`, `HTTP_METHODS`, `Resource`, `ResourcePayload`       |
| 10  | `role-user.model.ts`     | `RoleUser`                                                        |
| 11  | `resource-role.model.ts` | `ResourceRole`                                                    |
| 12  | `auth.model.ts`          | `SessionTokens`, `EffectivePermission`                            |
| 13  | `dashboard.model.ts`     | `DashboardStats`, `DashboardData`                                 |

✅ Nombres de tabla y columnas coinciden con el backend · ✅ `DECIMAL` tratado
como `Money = number | string` · ✅ `status` fuera de los DTO de `PATCH`.

## 2.3 · Servicios de API (10)

| Servicio          | Base                | Envoltura                                       |
| ----------------- | ------------------- | ----------------------------------------------- |
| `ClientApi`       | `/clientes`         | `clients` / `client`                            |
| `ProductTypeApi`  | `/tipos-producto`   | `product_types` / `product_type`                |
| `ProductApi`      | `/productos`        | `products` / `product`                          |
| `SaleApi`         | `/ventas`           | `sales` / `sale` (`create` → `{ sale, items }`) |
| `ProductSaleApi`  | `/detalle-ventas`   | `product_sales` / `product_sale`                |
| `UserApi`         | `/usuarios`         | `users` / `user` (+ `/permissions`)             |
| `RoleApi`         | `/roles`            | `roles` / `role`                                |
| `ResourceApi`     | `/recursos`         | `resources` / `resource`                        |
| `RoleUserApi`     | `/asignaciones-rol` | `assignments` / `assignment`                    |
| `ResourceRoleApi` | `/concesiones-rol`  | `grants` / `grant`                              |

✅ Todos `providedIn: 'root'` · ✅ URL desde `environment.apiUrl` · ✅
`deactivate` con `PATCH /:id/deactivate` · ✅ `reactivate` en los dos pivotes.

## 2.4 · Utilidades

| Archivo                         | Contenido                                       | Pruebas |
| ------------------------------- | ----------------------------------------------- | ------- |
| `core/utils/api-error.ts`       | `toApiMessage(error)`                           | 5 casos |
| `core/services/notification.ts` | `NotificationService` (success/info/warn/error) | —       |
| `core/utils/media-query.ts`     | `watchMediaQuery(query)` → `Signal<boolean>`    | 2 casos |

✅ `status 0` → mensaje de backend caído · ✅ `{error, detail}` unidos con `—` ·
✅ `matchMedia` ausente en jsdom → `false` sin romper.

## 2.5 · Componentes compartidos

| Componente   | Selector            | Entradas                   |
| ------------ | ------------------- | -------------------------- |
| `PageHeader` | `<app-page-header>` | `title`, `subtitle`        |
| `EmptyState` | `<app-empty-state>` | `icon`, `title`, `message` |
| `StatusTag`  | `<app-status-tag>`  | `status`                   |

✅ Sin lógica de negocio · ✅ `p-tag` con severidad `success`/`danger` · ✅
2 pruebas para `StatusTag`.

### Corrección durante el bloque

`npx tsc -p tsconfig.app.json --noEmit` falló:

```
src/app/core/models/resource-role.model.ts(1,10):
error TS2305: Module '"./api.model"' has no exported member 'HttpMethod'.
```

`HttpMethod` está en `resource.model.ts`. Corregido el import → `TSC_EXIT=0`.

## 2.6 · Layout y Shell

| Archivo                                      | Estado                                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| `layout/header/header.{ts,html,css}`         | ✅ `menuRequested`                                                            |
| `layout/aside/aside.{ts,html,css}`           | ✅ `items` + `navigated`                                                      |
| `layout/footer/footer.{ts,html,css}`         | ✅ año dinámico                                                               |
| `layout/shell/shell.{ts,html,css}`           | ✅ Header + Aside + `router-outlet` + Footer + Drawer + Toast + ConfirmDialog |
| `layout/shell/shell.spec.ts`                 | ✅ 2 pruebas                                                                  |
| `features/construir/construir.{ts,html,css}` | ✅ prototipo con `<app-ejemplo />`                                            |
| `app.ts` / `app.html`                        | ✅ solo `<router-outlet />`                                                   |
| `app.routes.ts`                              | ✅ Shell en `''`, `construir` lazy, `**` → `''`                               |
| `app.spec.ts`                                | ✅ 2 pruebas con `provideRouter([])`                                          |

✅ El Shell compone el layout **una sola vez** · ✅ el botón del Header colapsa el
Aside en escritorio y abre el Drawer en móvil · ✅ `/construir` accesible.

## 2.7 · `provideHttpClient()`

```ts
import { provideHttpClient } from '@angular/common/http';

providers: [
  provideBrowserGlobalErrorListeners(),
  provideHttpClient(),   // sin interceptores hasta ISS-08
  provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling(...)),
  providePrimeNG({ ... }),
  MessageService,
  ConfirmationService,
]
```

✅ `TSC_EXIT=0` · ⏳ interceptores de sesión/errores quedan para ISS-08.

## 2.8 · Build de producción

```bash
npm run build
```

```
Initial chunk files | Names         |  Raw size | Estimated transfer size
chunk-M6CEUXVL.js   | -             | 389.37 kB |               102.27 kB
main-WHXBKGT5.js    | main          | 319.06 kB |                54.60 kB
styles-RSQTZTDO.css | styles        |  27.35 kB |                 5.34 kB
                    | Initial total | 735.78 kB |               162.21 kB

Lazy chunk files    | Names         |  Raw size
chunk-GMGYAN5V.js   | construir     |  43.02 kB

Application bundle generation complete. [7.508 seconds]
BUILD_EXIT=0
```

✅ Sin errores ni warnings de presupuesto (735.78 kB < 750 kB) · ✅ `construir`
queda en chunk perezoso.

## 2.9 · Pruebas unitarias

```bash
npm test -- --watch=false
```

```
 ✓ src/app/demo/ejemplo/ejemplo.spec.ts (4 tests)
 ✓ src/app/layout/shell/shell.spec.ts (2 tests)

 Test Files  7 passed (7)
      Tests  19 passed (19)
   Duration  17.10s
TEST_EXIT=0
```

| Archivo                                   | Casos  |
| ----------------------------------------- | ------ |
| `app.spec.ts`                             | 2      |
| `demo/ejemplo/ejemplo.spec.ts`            | 4      |
| `features/clients/client-api.spec.ts`     | 2      |
| `core/utils/api-error.spec.ts`            | 5      |
| `core/utils/media-query.spec.ts`          | 2      |
| `shared/ui/status-tag/status-tag.spec.ts` | 2      |
| `layout/shell/shell.spec.ts`              | 2      |
| **Total**                                 | **19** |

## 2.10 · Servidor de desarrollo

```bash
npm start > ~/.opencode-term/ng-serve.log 2>&1 &
sleep 40
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:4200
```

```
Application bundle generation complete. [14.725 seconds]
Watch mode enabled. Watching for file changes.
➜  Local:   http://localhost:4200/
HTTP 200
```

## 2.11 · Comprobación visual

`http://localhost:4200` → redirección a `/construir` dentro del Shell.

| Comprobación                 | Esperado                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| Header                       | botón `pi pi-bars` + «TextilClean Express»                   |
| Aside (escritorio ≥ 1024 px) | Clientes, Tipos de producto, Productos, Ventas, Prototipo    |
| Contenido                    | tarjeta «Prototipo de componentes» + `<app-ejemplo />`       |
| Footer                       | «© 2026 TextilClean Express · …»                             |
| Botón del menú               | colapsa/expande el Aside en escritorio; abre Drawer en móvil |

---

## Evidencias (capturas)

| #   | Archivo                                                                            | Bloque                              |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | [`imagenes/iss-02-01-entornos.png`](imagenes/iss-02-01-entornos.png)               | 2.1 entornos + `angular.json`       |
| 2   | [`imagenes/iss-02-02-modelos.png`](imagenes/iss-02-02-modelos.png)                 | 2.2 13 modelos                      |
| 3   | [`imagenes/iss-02-03-servicios-api.png`](imagenes/iss-02-03-servicios-api.png)     | 2.3 10 servicios                    |
| 4   | [`imagenes/iss-02-04-utilidades.png`](imagenes/iss-02-04-utilidades.png)           | 2.4 utilidades + pruebas            |
| 5   | [`imagenes/iss-02-05-componentes-ui.png`](imagenes/iss-02-05-componentes-ui.png)   | 2.5 componentes compartidos         |
| 6   | [`imagenes/iss-02-05b-correccion-tsc.png`](imagenes/iss-02-05b-correccion-tsc.png) | 2.5 corrección `HttpMethod` + `tsc` |
| 7   | [`imagenes/iss-02-06-layout-shell.png`](imagenes/iss-02-06-layout-shell.png)       | 2.6 layout, Shell y rutas           |
| 8   | [`imagenes/iss-02-07-httpclient.png`](imagenes/iss-02-07-httpclient.png)           | 2.7 `provideHttpClient()`           |
| 9   | [`imagenes/iss-02-08-build.png`](imagenes/iss-02-08-build.png)                     | 2.8 `npm run build`                 |
| 10  | [`imagenes/iss-02-09-test.png`](imagenes/iss-02-09-test.png)                       | 2.9 `npm test`                      |
| 11  | [`imagenes/iss-02-10-serve.png`](imagenes/iss-02-10-serve.png)                     | 2.10 `ng serve` + `200`             |
| 12  | [`imagenes/iss-02-11-pantalla.png`](imagenes/iss-02-11-pantalla.png)               | 2.11 Shell en el navegador          |

Las capturas se tomaron de la terminal real controlada desde opencode (ventana
`Evidencias - TextilClean Express`) y de la ventana del navegador, nunca del chat.
En los bloques largos la captura muestra el **final del bloque y su resultado**
(listados, `tsc`, build o test), que es lo que se necesita comprobar.

---

## Diferencias respecto a la guía

| #   | Guía                                             | Este proyecto                     | Motivo                                     |
| --- | ------------------------------------------------ | --------------------------------- | ------------------------------------------ |
| 1   | ISS-01B crea Header, Aside, Footer y `construir` | ISS-02 los crea                   | ISS-01B no se ejecutó                      |
| 2   | `construir` es ruta de primer nivel              | `construir` es hija del Shell     | el prototipo debe verse dentro del layout  |
| 3   | Aside con `PanelMenu`                            | Aside con `RouterLink` + Tailwind | el criterio de ISS-02 no exige `PanelMenu` |
| 4   | «8 archivos, 33 casos»                           | 7 archivos, 19 casos              | la guía contaba las pruebas de ISS-01B     |
| 5   | `requireAuth` se lee en ISS-08                   | igual                             | queda declarado y sin usar                 |

---

## Incidencia del entorno

Al abrir el navegador para la captura 2.11, `wsl.exe` volvió a responder
`Wsl/Service/0x8007274c`. La captura ya estaba tomada; la recuperación fue:

```powershell
wsl --shutdown
# relanzar la terminal de evidencias
# relanzar npm start (o npm run dev en el backend)
```

> `wsl --shutdown` cierra todas las distros: se pierden el backend, `ng serve` y
> la terminal de evidencias.

---

## Cierre

- ✅ 2.1 entornos + `fileReplacements`.
- ✅ 2.2 13 modelos alineados con el backend.
- ✅ 2.3 10 servicios con las envolturas reales.
- ✅ 2.4 `api-error`, `notification` y `media-query` con pruebas.
- ✅ 2.5 `PageHeader`, `EmptyState` y `StatusTag`.
- ✅ 2.6 Header, Aside, Footer, Shell, `construir` y rutas.
- ✅ 2.7 `provideHttpClient()` sin interceptores.
- ✅ 2.8 build `0` · 2.9 19/19 pruebas · 2.10 `4200` → `200`.
- ✅ 12 capturas en `docs/imagenes/`.

Siguiente: **ISS-03 · Módulo de Clientes** (requiere el backend en `:3000`).
