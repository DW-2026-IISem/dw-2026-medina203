# ISS-06 · Ventas transaccionales — Registro de verificación

**Fecha:** 03-nov-2026
**Proyecto:** `front-textilclean-express` (carpeta `frontend-2026`)
**Guía:** [`ISS-06 FRONTEND-TEXTILCLEAN-EXPRESS.md`](ISS-06%20FRONTEND-TEXTILCLEAN-EXPRESS.md)
**Estado:** ✅ Código, build, pruebas, comprobación transaccional y capturas OK ·
⚠️ cancelar/eliminar venta devuelven `403` por el catálogo RBAC del backend

> Entorno: el mismo de [ISS-04](iss-04-verificacion.md#entorno-de-esta-verificación).

---

## 6.1 · Modelo

`sale.model.ts` de ISS-02 es **más fiel al backend** que el de la guía
(`sale_date`, `SaleItemInput`, `UpdateSaleDto` sin `client_id`), así que no se
sobrescribió. Se añadieron:

- `SaleItem` (línea con `unit_price`, `line_total`, `status`).
- `items?: SaleItem[]` **opcional**, con la nota de que `GET /api/ventas` del
  backend actual **no** incluye las líneas:

```bash
curl -s localhost:3000/api/ventas/11 -H "$AUTH"
# {"sale":{"id":11,"sale_date":"…","subtotal":"137700.00","tax":"0.00","discounts":"0.00",
#   "total":"137700.00","client_id":1,"status":"active",…}}      ← sin items
```

## 6.2 – 6.5 · Servicio, formulario y listado

| Archivo                             | Estado                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `sales/sale-api.ts`                 | ✅ `/ventas`, `create` transaccional                                     |
| `sales/sale-api.spec.ts`            | ✅ 4 casos                                                               |
| `sale-form/sale-form.{ts,html}`     | ✅ borrador en `signal`, totales con `computed`, validación de stock     |
| `sale-form/sale-form.spec.ts`       | ✅ 7 casos                                                               |
| `sale-list/sale-list.{ts,html}`     | ✅ `forkJoin(ventas, clientes, productos)`, cancelar y eliminar          |
| `sale-list/sale-list.spec.ts`       | ✅ 3 casos                                                               |

El payload **no lleva precios ni totales**: el formulario solo calcula
`Number(product.price) * quantity` para **mostrar** el borrador.

## 6.6 · Rutas y menú

`/ventas` y `/ventas/nueva` (lazy, hijas del Shell) y «Ventas»
(`pi pi-shopping-cart`) añadida al array del Shell.

---

## Correcciones respecto al código de la guía

| #   | Error                                                             | Causa                                                    | Corrección                                                            |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | `NG8001: 'p-card' is not a known element` (sale-form.html)        | `sale-form.ts` no importaba `CardModule`                 | se añadió `CardModule` a `imports`                                    |
| 2   | `TS2339: Property 'items' does not exist on type 'Sale'`          | modelo de ISS-02 sin `items`                             | `items?: SaleItem[]` opcional                                         |
| 3   | columna Fecha vacía                                               | la plantilla leía `sale.created_at`; el backend envía `sale_date`/`createdAt` | `sale.sale_date \| date: 'short'` (y el spec usa `sale_date`) |
| 4   | columna Líneas siempre `0`                                        | el backend no envía `items`                              | muestra `—` cuando no hay `items`                                     |
| 5   | `Unhandled Rejection NG04002: Cannot match any routes 'ventas'` (exit 1 con 100/100 verdes) | `provideRouter([])` en `sale-form.spec.ts` y el formulario navega a `/ventas` | `provideRouter([{ path: 'ventas', children: [] }])` |
| 6   | `p-select` de cliente sin `inputId`                               | accesibilidad                                            | `inputId="sale-client"` + `ariaLabel="Cliente"`                      |

---

## Pruebas y build

```
 Test Files  19 passed (19)
      Tests  100 passed (100)
TEST_EXIT=0

Initial total | 570.97 kB | 133.31 kB
sale-form     |   9.06 kB
sale-list     |   5.45 kB
BUILD_EXIT=0
```

---

## Comprobación transaccional (UI + backend + BD)

| Paso                                         | Resultado observado                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/ventas`                                    | 10 ventas del seeder; `GET /ventas` + `/clientes` + `/productos` en paralelo        |
| Stock antes (producto 16)                    | **30**                                                                              |
| Borrador: cliente + «Detergente Textil 5L» × 3 | totales $137,700.00; **solo GET** en la red; stock sigue en 30                    |
| «Registrar venta»                            | `POST /api/ventas` → navega a `/ventas`, «11 registradas»                           |
| Stock después                                | **27** (descontado por el backend)                                                  |
| Stock insuficiente en el cliente (100 > 27)  | «Stock insuficiente de «Detergente Textil 5L»: disponible 27, solicitado 100.»; no añade la línea |
| Stock insuficiente en el backend (curl)      | `400 {"error":"Insufficient stock for product 7"}`                                  |
| Rollback                                     | ventas 11→11, líneas 26→26, stock 16 = 27 (la línea válida del mismo payload **no** se aplicó) |
| Venta con `tax: 19` (curl)                   | `total = subtotal + 19` (91 800 + 19 = 91 819): `tax` es **valor absoluto**, no %  |
| Cancelar venta #13 desde la UI               | `PATCH /api/ventas/13/deactivate` → **403** «Forbidden: no grant for PATCH …», toast de error |

### Límite del backend: cancelar/eliminar ventas

El catálogo de recursos sembrado solo tiene, para ventas:

```text
 22 | GET    | /api/ventas
 23 | GET    | /api/ventas/:id
 24 | POST   | /api/ventas
 25 | GET    | /api/detalle-ventas
```

No existe recurso para `PATCH /api/ventas/:id/deactivate`, `PUT/PATCH
/api/ventas/:id` ni `DELETE /api/ventas/:id`, así que **ni el admin** puede
cancelar o borrar una venta (`403`). La UI lo comunica correctamente con
`toApiMessage`. Es el «límite real del backend» que la guía ISS-09 §9.5 pide
reflejar ocultando esos botones; **no** se modificó el backend.

---

## Evidencias (capturas)

| #   | Archivo                                                                                | Bloque                       |
| --- | -------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | [`imagenes/iss-06-01-lista.png`](imagenes/iss-06-01-lista.png)                         | listado de ventas            |
| 2   | [`imagenes/iss-06-02-borrador.png`](imagenes/iss-06-02-borrador.png)                   | borrador con totales         |
| 3   | [`imagenes/iss-06-03-stock-insuficiente.png`](imagenes/iss-06-03-stock-insuficiente.png) | validación de stock local  |
| 4   | [`imagenes/iss-06-04-registrada.png`](imagenes/iss-06-04-registrada.png)               | venta registrada             |
| 5   | [`imagenes/iss-06-05-cancelar-403.png`](imagenes/iss-06-05-cancelar-403.png)           | 403 al cancelar              |

---

## Cierre

- ✅ El formulario carga clientes y productos activos.
- ✅ No se agregan líneas sin producto o con cantidad < 1.
- ✅ Stock validado en el cliente y de nuevo en el backend.
- ✅ Totales recalculados con `computed`.
- ✅ Al guardar navega a `/ventas` y el stock baja (30 → 27).
- ✅ Stock insuficiente → error y **ningún** registro creado.
- ✅ build `0` · 100/100 pruebas · 5 capturas.
- ⚠️ Cancelar/eliminar venta: `403` por diseño del catálogo RBAC del backend.

Siguiente: **ISS-07 · Detalle de ventas y dashboard**.
