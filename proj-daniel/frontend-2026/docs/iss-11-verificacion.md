# ISS-11 · Build, calidad y cierre del proyecto — Registro de verificación

**Fecha:** 03-nov-2026
**Proyecto:** `front-textilclean-express` (carpeta `frontend-2026`)
**Guía:** [`ISS-11 FRONTEND-TEXTILCLEAN-EXPRESS.md`](ISS-11%20FRONTEND-TEXTILCLEAN-EXPRESS.md)
**Estado:** ✅ Build, calidad, 15/15 puntos de humo y publicación OK ·
⚠️ emulación de Fase I no aplicable a este backend (sin `AUTH_ENABLED`)

> Entorno: el mismo de [ISS-04](iss-04-verificacion.md#entorno-de-esta-verificación),
> sesión real (sin inyección).

---

## 11.1 · Entornos

| Archivo                      | `apiUrl`                    | `requireAuth` |
| ---------------------------- | --------------------------- | ------------- |
| `environment.development.ts` | `http://localhost:3000/api` | `true`        |
| `environment.ts`             | `http://localhost:3000/api` | `true`        |

Sin barra final · `fileReplacements` de ISS-02 intacto.

### Emular la Fase I (no aplicable)

La emulación necesita `AUTH_ENABLED=false` en el backend, y **este backend no
tiene esa bandera**: `authenticate` + `authorize` están fijos en todas las
rutas de negocio.

```bash
for p in clientes tipos-producto productos ventas detalle-ventas; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/$p)"
done
# clientes 401 · tipos-producto 401 · productos 401 · ventas 401 · detalle-ventas 401
```

Con `requireAuth: false` el frontend enviaría las peticiones sin token y todas
responderían `401`, que es justo la combinación que la guía pide **no**
mezclar. No se cambió la bandera; la entrega queda en Fase II
(`requireAuth: true`). La rama `!environment.requireAuth` de guards, directiva e
interceptor queda cubierta por el código, sin prueba en vivo.

## 11.2 · Scripts y Vitest

- `package.json`: **no** se aplicó el `cat >` de la guía (borraría
  `dependencies`). `docs:check` no se añadió porque `tools/check-docs.mjs` no
  existe en el proyecto.
- `vitest-base.config.mts` creado (`maxWorkers: 2`, `testTimeout: 20_000`).
- `angular.json` → `architect.test.options.runnerConfig: true`.

> **Incidencia.** Tras activar `runnerConfig` aparecieron 30 fallos con
> «Cannot configure the test module when the test module has already been
> instantiated». No era la configuración: un cambio de esta ISS (ver 11.4,
> corrección 1) rompía `product-list.spec` y `sale-list.spec`, y al fallar
> dentro de `beforeEach` el TestBed quedaba instanciado y **arrastraba** a los
> archivos siguientes del mismo worker. Corregidas esas specs, la suite pasa
> igual con y sin `runnerConfig` (dos ejecuciones seguidas: 4.69 s y 4.61 s).

## 11.3 · Presupuestos

```json
{ "type": "initial", "maximumWarning": "750kB", "maximumError": "1MB" },
{ "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
```

```text
Initial total | 582.27 kB | 138.71 kB
$ ng build 2>&1 | grep -i budget || echo "sin warnings de budget: correcto"
sin warnings de budget: correcto
```

---

## 11.4 · Checklist de humo (código final, navegador real)

| #   | Acción                  | Resultado observado                                                                                                                                                                                             | ✓                         |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 1   | `/dashboard` sin sesión | `/login?returnUrl=%2Fdashboard`, 0 peticiones                                                                                                                                                                   | ✅                        |
| 2   | Login admin             | dashboard; menú Operación (6) + Cuenta + Seguridad (5); «ADMIN · 58 permisos»                                                                                                                                   | ✅                        |
| 3   | CRUD cliente            | `POST` «Lavandería Humo» → búsqueda «1 de 11» → `PATCH /clientes/11` (teléfono) → baja lógica; BD: `3009998877 · inactive`                                                                                      | ✅                        |
| 4   | CRUD tipo               | `POST` → `PATCH /tipos-producto/28` → `/deactivate`; BD: `Humo editado · inactive`                                                                                                                              | ✅                        |
| 5   | Productos               | tipo como texto, precio con moneda, stock con color **y número**                                                                                                                                                | ✅                        |
| 6   | Nueva venta             | 2 × «Detergente Textil 5L» → `POST /api/ventas`; stock **25 → 23**                                                                                                                                              | ✅                        |
| 7   | Detalle ventas          | por venta con «Ver detalle» (líneas de `/detalle-ventas` filtradas por `sale_id`); editar/eliminar línea **no se ofrece**: el catálogo RBAC solo concede `GET`                                                  | ⚠️ por diseño del backend |
| 8   | Dashboard               | 10 · 25 · 16 · **$335,624.86** = BD `clientes=10 tipos=25 productos=16 ingresos=335624.86`                                                                                                                      | ✅                        |
| 9   | RBAC admin              | rol `REPORTES`, recurso `GET /api/reportes`, asignación seller↔REPORTES, concesión REPORTES→recurso                                                                                                             | ✅                        |
| 10  | Ver permisos            | seller: roles SELLER + REPORTES; fila `GET /api/reportes · REPORTES`                                                                                                                                            | ✅                        |
| 11  | Logout                  | `POST /api/sesion/logout` → `/login`; `localStorage` = `null`                                                                                                                                                   | ✅                        |
| 12  | Login seller            | menú reducido (Panel, Clientes, Productos, Ventas, Mi perfil); `/admin/roles` → `/forbidden?permission=GET /api/roles`                                                                                          | ✅                        |
| 13  | Recargar navegador      | `page.goto('/clientes')` con sesión → sigue dentro; `GET /api/clientes [Bearer]`                                                                                                                                | ✅                        |
| 14  | Token expirado          | 3×`401` → **1** `POST /sesion/refresh` → 3 reintentos con `Bearer` nuevo                                                                                                                                        | ✅                        |
| 15  | Revocar refresh token   | logout del refresh en el backend (200) + access caducado → `401` → refresh `401` → `/login?returnUrl=%2Fproductos&reason=expired` con «Tu sesión expiró o fue cerrada. Vuelve a iniciar sesión.»; storage vacío | ✅                        |

### Correcciones encontradas por el humo

| #   | Problema                                                                                                                                                                         | Corrección                                                                                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **seller abre `/productos` y la lista sale vacía** con «Forbidden: no grant for GET /api/tipos-producto»: `ProductList` hacía `forkJoin(productos, tipos)` y seller no lee tipos | `ProductList` solo pide tipos si `canPermission('GET /api/tipos-producto')`; si no, muestra «Tipo #id». Igual en `SaleList` para clientes y productos. Prueba nueva: _«should list products without asking for types when the role cannot read them»_ |
| 2   | punto 15: al fallar el refresh se volvía al login **sin mensaje**                                                                                                                | el interceptor añade `reason=expired` y el login muestra un `p-message` de aviso; prueba del interceptor actualizada                                                                                                                                  |
| 3   | 7 botones de icono sin `pTooltip` (sale-form, role-list, resource-list)                                                                                                          | `pTooltip` = su `aria-label` (+ `TooltipModule` en sale-form)                                                                                                                                                                                         |
| 4   | 4 archivos sin formato Prettier                                                                                                                                                  | `prettier --write`                                                                                                                                                                                                                                    |

---

## 11.6 · Calidad

```text
$ npx prettier --check "src/**/*.{ts,html,css}"
All matched files use Prettier code style!

$ grep -rn ": any\|<any>\|as any" src/app --include=*.ts | grep -v .spec.ts
sin any fuera de specs

botones de icono: todos con aria-label y pTooltip
```

Accesibilidad mínima: todos los `input` con `label`/`aria-label` (se añadieron
`inputId` a los `p-select` de venta, asignaciones y concesiones), botones de
icono con `aria-label` + `pTooltip`, y el stock muestra el número además del
color.

## 11.7 · Publicación

```bash
ng build      # dist/front-textilclean-express/browser/
node spa-server.mjs dist/front-textilclean-express/browser 8080   # fallback a index.html
```

| URL directa en `:8080` | Resultado                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `/`                    | `200 text/html`                                                                           |
| `/clientes`            | `200 text/html`                                                                           |
| `/admin/usuarios`      | `200` → sin sesión `/login?returnUrl=%2Fadmin%2Fusuarios` → login → vuelve a **Usuarios** |
| `/ventas/nueva`        | `200` → recarga directa con sesión: formulario de venta con datos                         |
| `/no-existe`           | `200 text/html` → la app redirige a `/dashboard`                                          |

> El servidor de prueba es un script Node de 20 líneas equivalente a
> `try_files $uri $uri/ /index.html;` de Nginx (§11.7).

### CORS

```text
$ curl -s -D - -o /dev/null -H "Origin: http://localhost:4200" localhost:3000/api/clientes
HTTP/1.1 401 Unauthorized
Access-Control-Allow-Origin: *
```

`401` → protegido (Fase II) y CORS abierto.

---

## Build y pruebas (medido)

| Comando                                         | Resultado                                             |
| ----------------------------------------------- | ----------------------------------------------------- |
| `npm test -- --watch=false`                     | **30 archivos, 137 pruebas** aprobadas                |
| `npm run build`                                 | **0 errores**; inicial **582.27 kB** (warning 750 kB) |
| `npx prettier --check "src/**/*.{ts,html,css}"` | todos formateados                                     |
| `/dashboard` sin sesión                         | `/login?returnUrl=%2Fdashboard`                       |
| `/construir`                                    | renderiza sin peticiones `/api`                       |

Evolución de la suite en este recorrido:

| ISS            | Archivos | Pruebas |
| -------------- | -------- | ------- |
| 03 (corregido) | 10       | 41      |
| 04             | 13       | 63      |
| 05             | 16       | 86      |
| 06             | 19       | 100     |
| 07             | 23       | 115     |
| 08             | 25       | 123     |
| 09             | 27       | 130     |
| 10             | 30       | 136     |
| 11             | 30       | **137** |

---

## Evidencias (capturas)

| #   | Archivo                                                                                  | Punto             |
| --- | ---------------------------------------------------------------------------------------- | ----------------- |
| 1   | [`imagenes/iss-11-01-sin-sesion.png`](imagenes/iss-11-01-sin-sesion.png)                 | 1                 |
| 2   | [`imagenes/iss-11-02-admin-dashboard.png`](imagenes/iss-11-02-admin-dashboard.png)       | 2                 |
| 3   | [`imagenes/iss-11-03-cliente.png`](imagenes/iss-11-03-cliente.png)                       | 3                 |
| 4   | [`imagenes/iss-11-05-productos.png`](imagenes/iss-11-05-productos.png)                   | 5                 |
| 5   | [`imagenes/iss-11-06-venta.png`](imagenes/iss-11-06-venta.png)                           | 6                 |
| 6   | [`imagenes/iss-11-08-dashboard.png`](imagenes/iss-11-08-dashboard.png)                   | 8                 |
| 7   | [`imagenes/iss-11-09-rbac.png`](imagenes/iss-11-09-rbac.png)                             | 9                 |
| 8   | [`imagenes/iss-11-10-ver-permisos.png`](imagenes/iss-11-10-ver-permisos.png)             | 10                |
| 9   | [`imagenes/iss-11-12-seller.png`](imagenes/iss-11-12-seller.png)                         | 12                |
| 10  | [`imagenes/iss-11-12b-seller-productos.png`](imagenes/iss-11-12b-seller-productos.png)   | 12 (corrección 1) |
| 11  | [`imagenes/iss-11-14-token-expirado.png`](imagenes/iss-11-14-token-expirado.png)         | 14                |
| 12  | [`imagenes/iss-11-15-refresh-revocado.png`](imagenes/iss-11-15-refresh-revocado.png)     | 15                |
| 13  | [`imagenes/iss-11-16-dist-ruta-profunda.png`](imagenes/iss-11-16-dist-ruta-profunda.png) | 11.7 publicación  |

---

## Cierre

- ✅ `ng build` 0 errores, sin warnings de presupuesto.
- ✅ 15/15 puntos de humo (el 7 con el límite documentado del backend).
- ✅ Revocar el refresh cierra la sesión con mensaje claro.
- ✅ `prettier --check` limpio.
- ✅ `dist/` servido con fallback SPA; rutas profundas recargan bien.
- ⚠️ Emulación de Fase I: no aplicable (el backend no tiene `AUTH_ENABLED`).

**Fin del recorrido ISS-00 → ISS-11.**
