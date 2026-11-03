# ISS-04 · CRUD de tipos de producto — Registro de verificación

**Fecha:** 03-nov-2026
**Proyecto:** `front-textilclean-express` (carpeta `frontend-2026`)
**Guía:** [`ISS-04 FRONTEND-TEXTILCLEAN-EXPRESS.md`](ISS-04%20FRONTEND-TEXTILCLEAN-EXPRESS.md)
**Estado:** ✅ Código, build, pruebas, comprobación funcional y capturas OK

---

## Entorno de esta verificación

Esta ISS (y las siguientes, hasta ISS-11) se ejecutó en un **contenedor Linux en
la nube** (sesión de Claude Code), no en el equipo WSL de referencia:

| Elemento | Valor                                                                      |
| -------- | -------------------------------------------------------------------------- |
| Node/npm | `v22.23.4` / `10.9.9` (cumple `^22.22.3`)                                  |
| Backend  | `app-textilclean-express` con `npx ts-node src/server.ts` en `:3000`       |
| BD       | PostgreSQL 16 local (`DB_ENGINE=postgres`, BD `textilclean`) + `db:seed`   |
| App      | `ng serve` en `:4200`                                                      |
| Capturas | Chromium headless (Playwright) sobre `http://localhost:4200`, nunca chat   |

> **Autenticación en Fase I.** Este backend **no tiene** `AUTH_ENABLED`: todas
> las rutas de negocio exigen `authenticate + authorize` (`401 Missing Bearer
> token` sin token). Como la UI de Fase I no envía token, el script de capturas
> hace login como `admin` y añade `Authorization: Bearer …` a las peticiones a
> `:3000/api` (`page.route`). El código del frontend **no** se modificó para
> ello; en ISS-08 el interceptor real ocupa ese lugar.

---

## Correcciones heredadas de ISS-03 (antes de empezar)

El commit «actualizacion frontend hasta iss-03» dejaba el proyecto **sin
compilar**. Se corrigió antes de tocar ISS-04:

| #   | Síntoma                                                                 | Causa                                                                     | Corrección                                                                       |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | `TS2339: Property 'toggleMenu' / 'isDesktop' / … does not exist on Shell` | `shell.ts` se reemplazó con la versión corta de la guía (3.6.2) y `shell.html` seguía siendo el de ISS-02 | se restauró `shell.ts` de ISS-02 (`isDesktop`, `sidebarCollapsed`, `toggleMenu`, `closeMobile`, Toast y ConfirmDialog) |
| 2   | `TS2345: ClientPayload is not assignable to ClientCreatePayload`         | `ClientApi` tipado con `ClientCreatePayload` (password obligatorio)       | `ClientApi.create/update` reciben `ClientPayload` (la guía crea clientes sin password; la columna es `allowNull`) |
| 3   | `TS2304: Cannot find name 'spyOn'`                                       | las guías usan Jasmine; el runner es **Vitest**                           | `spyOn(...).and.callFake(fn)` → `vi.spyOn(...).mockImplementation(fn)`           |
| 4   | 9 fallos en `client-list.spec.ts` (`found none`)                         | `BASE = '/api/clientes'` (relativo) vs URL real `http://localhost:3000/api/clientes` | `BASE = \`${environment.apiUrl}/clientes\``                                       |
| 5   | Columna **Acciones vacía** en la tabla                                   | en PrimeNG 22 la directiva `pButton` ya no pinta el input `icon`          | `icon="pi …"` → hijo `<i pButtonIcon class="pi …"></i>` (también en ISS-04)     |

Tras las correcciones: **41/41** pruebas y build `0` en el estado de ISS-03.

---

## 4.1 · Endpoint y contrato

```bash
curl -s -o /dev/null -w "sin token %{http_code}\n" localhost:3000/api/tipos-producto
# sin token 401
curl -s localhost:3000/api/tipos-producto -H "$AUTH" | head -c 120
# {"product_types":[{"id":1,"name":"Movies","description":"Introducing the Malta-inspired Bike, …
```

✅ Envoltura `{ product_types }` / `{ product_type }` · ✅ ruta en español
`/tipos-producto` · ✅ `DELETE` responde `200` (la guía decía `204`; el
servicio ignora el cuerpo, así que no afecta).

## 4.2 · Modelo

`product-type.model.ts` ya existía desde ISS-02 (`ProductTypeCreatePayload` y
`ProductTypeUpdatePayload`). **No se sobrescribió**: se añadió
`ProductTypePayload` (`name`, `description`, `status?`), que es lo que emite el
formulario de la guía.

## 4.3 – 4.6 · Servicio, formulario y lista

| Archivo                                         | Estado                                                     |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `product-types/product-type-api.ts`             | ✅ `list/get/create/update/deactivate/remove`              |
| `product-types/product-type-api.spec.ts`        | ✅ 6 casos                                                 |
| `product-type-form/product-type-form.{ts,html}` | ✅ `input`/`output`, `resetKey`, `status` bloqueado al editar |
| `product-type-form/product-type-form.spec.ts`   | ✅ 8 casos                                                 |
| `product-type-list/product-type-list.{ts,html}` | ✅ `signal` + `computed(filterRows)`, `p-table` con `#body` |
| `product-type-list/product-type-list.spec.ts`   | ✅ 8 casos (`vi.spyOn`)                                    |
| `*.css`                                         | ✅ vacíos a propósito                                      |

## 4.7 · Ruta y menú

- `app.routes.ts`: `tipos-producto` lazy, hija del Shell.
- `shell.ts`: entrada «Tipos de producto» (`pi pi-tags`) entre Clientes y
  Prototipo (se editó el array, no se reemplazó el archivo — ver corrección 1).

---

## Verificación del ISS (bloque de la guía)

```text
# 1. servicio
10:/** /api/tipos-producto — la respuesta usa snake_case `product_types`. */
14:  private readonly base = `${environment.apiUrl}/tipos-producto`;
# 2. formulario solo emite
39:  readonly saved = output<ProductTypePayload>();
40:  readonly cancelled = output<void>();
# 3. computed + filterRows
53:  readonly visibleRows = computed(() =>
54:    filterRows(this.rows(), this.filter(), (row) => [row.name, row.description]),
# 4. pTemplate= → 0 coincidencias (correcto)
# 5. ruta y menú
src/app/app.routes.ts:19:        path: 'tipos-producto',
src/app/layout/shell/shell.ts:44:      routerLink: '/tipos-producto',
```

### Pruebas

```
 Test Files  13 passed (13)
      Tests  63 passed (63)
TEST_EXIT=0
```

| Archivo                                                       | Casos  |
| ------------------------------------------------------------- | ------ |
| ISS-01/02/03 (app, utils, demo, clients, shell, status-tag)   | 41     |
| `product-types/product-type-api.spec.ts`                      | 6      |
| `product-type-form/product-type-form.spec.ts`                 | 8      |
| `product-type-list/product-type-list.spec.ts`                 | 8      |
| **Total**                                                     | **63** |

### Build

```
Initial total     | 551.11 kB | 127.31 kB
chunk-B3Ic9J1q.js | product-type-list | 11.45 kB
Application bundle generation complete.
BUILD_EXIT=0
```

✅ `product-type-list` en chunk perezoso · ✅ sin warnings de presupuesto.

---

## Comprobación funcional (navegador real + backend real)

| Comprobación                      | Resultado observado                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| `/tipos-producto` por URL directa | Shell completo + tabla; `GET /api/tipos-producto`; etiqueta «25 activos»            |
| Crear «Lácteos»                   | `POST /api/tipos-producto` → toast «Tipo creado», «26 activos»                      |
| Buscador «Lácteos»                | «1 de 26 coinciden con «Lácteos»»; **0 peticiones nuevas**                           |
| Editar → «Lácteos y derivados»    | `PATCH /api/tipos-producto/26` (sin `status`); `p-select` bloqueado con la nota      |
| Baja lógica                       | confirmación → `PATCH /api/tipos-producto/26/deactivate` → «25 activos»; en BD `status = inactive` |
| Estado vacío                      | «Sin coincidencias · Ningún tipo coincide con la búsqueda…»                          |
| Validación                        | Guardar con nombre vacío no envía y marca el campo                                  |
| Baja física (curl)                | `DELETE /api/tipos-producto/27` → `200`                                              |
| Móvil 390 px                      | encabezado apilado, tabla con scroll horizontal dentro de la tarjeta                |

```sql
-- psql textilclean
 26 | Lácteos y derivados | inactive
```

---

## Evidencias (capturas)

| #   | Archivo                                                                          | Bloque                    |
| --- | -------------------------------------------------------------------------------- | ------------------------- |
| 1   | [`imagenes/iss-04-01-lista.png`](imagenes/iss-04-01-lista.png)                   | lista por URL directa     |
| 2   | [`imagenes/iss-04-02-filtro.png`](imagenes/iss-04-02-filtro.png)                 | filtro local              |
| 3   | [`imagenes/iss-04-03-editar.png`](imagenes/iss-04-03-editar.png)                 | diálogo de edición        |
| 4   | [`imagenes/iss-04-04-editado.png`](imagenes/iss-04-04-editado.png)               | `PATCH` aplicado          |
| 5   | [`imagenes/iss-04-05-baja-confirmar.png`](imagenes/iss-04-05-baja-confirmar.png) | confirmación de baja      |
| 6   | [`imagenes/iss-04-06-baja-hecha.png`](imagenes/iss-04-06-baja-hecha.png)         | tipo oculto tras la baja  |
| 7   | [`imagenes/iss-04-07-validacion.png`](imagenes/iss-04-07-validacion.png)         | validación de nombre      |
| 8   | [`imagenes/iss-04-08-movil.png`](imagenes/iss-04-08-movil.png)                   | vista móvil 390 px        |

> El aviso rojo «Invalid PrimeUI License» de las capturas es el esperado sin
> clave (`primeUiLicense: ''`), ver ISS-11 §11.5.

---

## Diferencias respecto a la guía

| #   | Guía                                     | Este proyecto                                | Motivo                                       |
| --- | ---------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| 1   | backend en `:4000`                       | `:3000` (`environment.apiUrl`)               | puerto real del backend                      |
| 2   | `AUTH_ENABLED=false` para Fase I         | no existe; token inyectado por el script     | el backend siempre protege el negocio        |
| 3   | reemplazar `shell.ts` completo           | solo se añade la entrada al array `items`    | conservar el Shell de ISS-02                 |
| 4   | `spyOn` (Jasmine)                        | `vi.spyOn` (Vitest)                          | runner del proyecto                          |
| 5   | botones con `icon="pi …"`                | `<i pButtonIcon class="pi …">`               | PrimeNG 22 no pinta `icon` en `pButton`      |
| 6   | `DELETE` → `204`                         | `200`                                        | respuesta real del backend                   |

---

## Cierre

- ✅ La tabla lista los tipos activos del backend.
- ✅ Crear/editar validan nombre obligatorio y máximo 120.
- ✅ La baja lógica oculta el tipo del listado.
- ✅ El buscador filtra por nombre y descripción con `filterRows`.
- ✅ `/tipos-producto` funciona por URL directa.
- ✅ build `0` · 63/63 pruebas · 8 capturas.

Siguiente: **ISS-05 · Productos con relación a tipos**.
