# ISS-09 · Guards y RBAC estructural en la UI — Registro de verificación

**Fecha:** 03-nov-2026
**Proyecto:** `front-textilclean-express` (carpeta `frontend-2026`)
**Guía:** [`ISS-09 FRONTEND-TEXTILCLEAN-EXPRESS.md`](ISS-09%20FRONTEND-TEXTILCLEAN-EXPRESS.md)
**Estado:** ✅ Código, build, pruebas, matriz por rol (admin / seller) y capturas OK

> Entorno: el mismo de [ISS-04](iss-04-verificacion.md#entorno-de-esta-verificación),
> sin inyección de token (la app gestiona su sesión desde ISS-08).

---

## 9.0 – 9.3A · Guards

| Archivo                           | Regla                                                              |
| --------------------------------- | ------------------------------------------------------------------ |
| `core/guards/auth-guard.ts`       | sin access token → `/login?returnUrl=<url>`                        |
| `core/guards/guest-guard.ts`      | con sesión, `/login` → `/dashboard`                                |
| `core/guards/permission-guard.ts` | `data.permission` no concedido → `/forbidden?permission=<permiso>` |
| `core/guards/auth-only-guard.ts`  | `/perfil` y `/admin/*` solo con auth real                          |

## 9.4 / 9.9 · Rutas

`authGuard` en el Shell; `permissionGuard` + `data.permission` en cada hija
(10 `canActivate` en `app.routes.ts`):

| Ruta              | Permiso                   |
| ----------------- | ------------------------- |
| `/dashboard`      | `GET /api/ventas`         |
| `/clientes`       | `GET /api/clientes`       |
| `/tipos-producto` | `GET /api/tipos-producto` |
| `/productos`      | `GET /api/productos`      |
| `/ventas`         | `GET /api/ventas`         |
| `/ventas/nueva`   | `POST /api/ventas`        |
| `/detalle-ventas` | `GET /api/detalle-ventas` |
| `/perfil`         | `authOnlyGuard`           |

## 9.5 · Directiva `*appHasPermission`

`shared/directives/has-permission.ts`: `input.required<string>()` + `effect()`
sobre `SessionStore.canPermission()`; crea o destruye la vista.

## 9.6 · Menú con `computed`

- `layout/shell/nav.config.ts`: `NAV` con grupos **Operación**, **Cuenta** y
  **Seguridad** (`authOnly`, vacío hasta ISS-10).
- `Shell.navGroups = computed(...)` filtra por `canPermission`.

**Adaptación del Shell.** La guía reescribe `shell.ts/html` asumiendo un
`Header`/`Aside` con entradas de sesión (ISS-01B, que este proyecto no
ejecutó), usa `session` privado en la plantilla, `user.first_name/last_name`
(inexistentes) y pierde el colapso de escritorio de ISS-02. Se integró sobre el
layout existente:

| Pieza    | Cambio                                                                                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Shell`  | conserva `isDesktop`/`sidebarCollapsed`/Drawer; añade `navGroups`, `roleLabel`, `initials` (del username), `reloadPermissions()`, `onLogout()`                                                                        |
| `Header` | `showSession`, `username`, `initials`, `roleLabel`; avatar + tag de rol + **menú popup** (Mi perfil · Actualizar permisos · Cerrar sesión) con `#userMenuPanel` (evita el error `Type 'Menu' has no call signatures`) |
| `Aside`  | acepta grupos (`MenuItem.items`) o lista plana; pie con usuario, rol, nº de permisos y «Cerrar sesión»                                                                                                                |

## 9.7 · `/forbidden`

Muestra el permiso requerido que llega en `?permission=`.

## 9.8 · Botones envueltos

| Pantalla          | Envueltos con `*appHasPermission`                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Clientes          | `POST`, `PATCH /:id`, `PATCH /:id/deactivate`, `DELETE /:id` sobre `/api/clientes`                   |
| Tipos de producto | los mismos 4 sobre `/api/tipos-producto`                                                             |
| Productos         | los mismos 4 sobre `/api/productos`                                                                  |
| Ventas            | `POST /api/ventas`, ver detalle (`GET /api/detalle-ventas`), cancelar y eliminar                     |
| Detalle de ventas | crear, editar, baja lógica y eliminar sobre `/api/detalle-ventas`                                    |
| Dashboard         | cada tarjeta por su fuente; «Stock bajo» por `GET /api/productos`; «Ver todas» por `GET /api/ventas` |

### Ajuste en el dashboard (más allá de ocultar tarjetas)

`SELLER` puede abrir el panel (`GET /api/ventas`) pero **no** tiene
`GET /api/tipos-producto`. Con el `forkJoin` de ISS-07 ese único `403`
tumbaba el panel entero. Ahora `Dashboard.ifAllowed()` solo pide las fuentes
concedidas (`of([])` para las demás). Prueba nueva:
_«should skip the sources the role cannot read (SELLER without product types)»_.

---

## Pruebas y build

| Archivo nuevo                                                    | Casos | Qué cubre                                                                                         |
| ---------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------- |
| `core/guards/guards.spec.ts`                                     | 5     | `authGuard` (anónimo / autenticado), `guestGuard`, `permissionGuard` (concedido / → `/forbidden`) |
| `shared/directives/has-permission.spec.ts`                       | 1     | pinta solo lo concedido y reacciona a `setAccess` / `clear`                                       |
| `dashboard.spec.ts` (+1, y sesión con permisos en los 3 previos) | 4     | carga parcial por rol                                                                             |

```
 Test Files  27 passed (27)
      Tests  130 passed (130)
TEST_EXIT=0

Initial total | 581.34 kB | 138.59 kB
BUILD_EXIT=0
```

---

## Comprobación funcional por rol

Permisos efectivos de `seller` (backend):

```text
GET /api/clientes      GET /api/clientes/:id
GET /api/productos     GET /api/productos/:id
GET /api/ventas        GET /api/ventas/:id      POST /api/ventas
```

| Comprobación                | `seller` (7 permisos)                                                                        | `admin` (58 permisos)                                       |
| --------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Menú                        | Panel, Clientes, Productos, Ventas · Mi perfil                                               | + Tipos de producto, Detalle de ventas                      |
| Dashboard                   | 3 tarjetas (sin «Tipos»); peticiones: clientes, productos, ventas — **sin** `tipos-producto` | 4 tarjetas, 4 peticiones                                    |
| `/clientes`                 | sin «Nuevo cliente» y **0** botones de fila                                                  | «Nuevo cliente» + **30** botones de fila (3 × 10)           |
| `/tipos-producto` por URL   | → `/forbidden?permission=GET /api/tipos-producto`, **0** peticiones                          | lista normal                                                |
| `/ventas`                   | solo «Nueva venta»                                                                           | «Nueva venta» + «Ver detalle»; **sin** cancelar ni eliminar |
| `/detalle-ventas`           | (no en el menú; URL → `/forbidden`)                                                          | **solo lectura**: ningún botón de escritura                 |
| `/login` con sesión abierta | → `/dashboard` (`guestGuard`)                                                                | igual                                                       |
| Menú de usuario             | avatar «SE», tag SELLER                                                                      | Mi perfil · Actualizar permisos · Cerrar sesión             |

### El backend manda

```bash
# seller forzando lo que la UI oculta
curl -s -X POST localhost:3000/api/clientes -H "$AUTH" -d '{"name":"Forzado"}'
# {"error":"Forbidden: no grant for POST /api/clientes"}  HTTP 403
curl -s localhost:3000/api/tipos-producto -H "$AUTH"
# {"error":"Forbidden: no grant for GET /api/tipos-producto"}  HTTP 403
```

La directiva y los guards son **UX**; la autorización real sigue en
`authorize` de Express.

---

## Evidencias (capturas)

| #   | Archivo                                                                                                  | Bloque                        |
| --- | -------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 1   | [`imagenes/iss-09-01-seller-dashboard.png`](imagenes/iss-09-01-seller-dashboard.png)                     | seller: menú y panel parcial  |
| 2   | [`imagenes/iss-09-02-seller-clientes.png`](imagenes/iss-09-02-seller-clientes.png)                       | seller: clientes sin acciones |
| 3   | [`imagenes/iss-09-03-seller-forbidden.png`](imagenes/iss-09-03-seller-forbidden.png)                     | `/forbidden` con el permiso   |
| 4   | [`imagenes/iss-09-04-seller-ventas.png`](imagenes/iss-09-04-seller-ventas.png)                           | seller: solo «Nueva venta»    |
| 5   | [`imagenes/iss-09-05-admin-dashboard.png`](imagenes/iss-09-05-admin-dashboard.png)                       | admin: panel completo         |
| 6   | [`imagenes/iss-09-06-admin-clientes.png`](imagenes/iss-09-06-admin-clientes.png)                         | admin: CRUD completo          |
| 7   | [`imagenes/iss-09-07-admin-ventas.png`](imagenes/iss-09-07-admin-ventas.png)                             | admin: ventas sin cancelar    |
| 8   | [`imagenes/iss-09-08-admin-detalle-solo-lectura.png`](imagenes/iss-09-08-admin-detalle-solo-lectura.png) | detalle solo lectura          |
| 9   | [`imagenes/iss-09-09-menu-usuario.png`](imagenes/iss-09-09-menu-usuario.png)                             | menú de usuario               |

---

## Cierre

- ✅ Guards `auth`, `guest`, `permission`, `authOnly` con pruebas.
- ✅ `*appHasPermission` reactiva a los permisos.
- ✅ Menú calculado con `computed` desde `NAV`.
- ✅ Botones de Business envueltos con los permisos exactos del catálogo.
- ✅ Ventas/detalle reflejan el límite real del backend (sin acciones que darían 403).
- ✅ build `0` · 130/130 pruebas · 9 capturas.

Siguiente: **ISS-10 · Administración RBAC**.
