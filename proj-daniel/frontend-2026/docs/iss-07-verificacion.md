# ISS-07 · Detalle de ventas, dashboard y cierre de Fase I — Registro de verificación

**Fecha:** 03-nov-2026
**Proyecto:** `front-textilclean-express` (carpeta `frontend-2026`)
**Guía:** [`ISS-07 FRONTEND-TEXTILCLEAN-EXPRESS.md`](ISS-07%20FRONTEND-TEXTILCLEAN-EXPRESS.md)
**Estado:** ✅ Código, build, pruebas, KPIs contra BD y capturas OK · ✅ Fase I cerrada

> Entorno: el mismo de [ISS-04](iss-04-verificacion.md#entorno-de-esta-verificación).

---

## 7.3 · Modelo y `toNumber`

- `product-sale.model.ts` (ISS-02) se conservó; se añadió `ProductSalePayload`.
- `core/utils/to-number.ts` creado como en la guía, pero importando `Money`
  desde **`api.model.ts`** (la guía lo importaba de `product.model.ts`, que no
  lo exporta en este proyecto).

## 7.4 – 7.8 · Componentes

| Archivo                                             | Estado                                                     | Casos |
| --------------------------------------------------- | ---------------------------------------------------------- | ----- |
| `product-sales/product-sale-api.ts`                 | ✅ `/detalle-ventas`, envoltura `product_sales`            | 4     |
| `product-sale-form/product-sale-form.{ts,html}`     | ✅ en edición solo `quantity` (venta, producto y estado bloqueados) | 4 |
| `sales/sale-detail/sale-detail.{ts,html}`           | ✅ presentacional, `input.required<Sale>()`                | —     |
| `product-sale-list/product-sale-list.{ts,html}`     | ✅ `forkJoin(líneas, ventas, productos)`                   | 3     |
| `dashboard/dashboard.{ts,html}`                     | ✅ `forkJoin` de 4 peticiones, `toNumber`, `computed`      | 3     |
| `sales/sale-list` (integración §7.6.4)              | ✅ botón «Ver detalle» + `p-dialog` con `<app-sale-detail>` | 4    |

```text
dashboard.ts:10:import { forkJoin } from 'rxjs';
dashboard.ts:16:import { toNumber } from '../../core/utils/to-number';
dashboard.ts:57:  readonly lowStock = computed(() =>
dashboard.ts:61:  readonly revenue = computed(() =>
dashboard.ts:62:    this.sales().reduce((sum, sale) => sum + toNumber(sale.total), 0),
```

## 7.9 · Rutas y menú

- `''` redirige a **`dashboard`**; `**` también.
- Nuevas rutas lazy: `dashboard`, `detalle-ventas`.
- Menú: «Panel» (primero) y «Detalle de ventas» añadidos al array del Shell.

---

## Correcciones respecto al código de la guía

| #   | Error / problema                                                 | Corrección                                                                           |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | `TS2551: Property 'created_at' does not exist on type 'Sale'` (dashboard.ts, sale-detail.html, dashboard.html) | `sale_date` (campo real del backend) en código y specs |
| 2   | `to-number.ts` importaba `Money` de `product.model`              | import desde `api.model`                                                             |
| 3   | `SaleDetail` usa `sale.items`, que `GET /api/ventas` **no** envía (el diálogo saldría vacío) | `SaleList.openDetail()` pide `GET /api/detalle-ventas`, filtra por `sale_id` y pasa la venta con `items`; `SaleDetail` sigue siendo presentacional. Prueba nueva: _«should load the lines of a sale without items from /detalle-ventas»_ |
| 4   | §7.6.4 es una edición manual (no un `cat >`)                     | aplicada a mano en `sale-list.ts` / `sale-list.html`                                 |

---

## Pruebas y build

```
 Test Files  23 passed (23)
      Tests  115 passed (115)
TEST_EXIT=0

Initial total     | 571.22 kB | 133.31 kB
product-sale-list | 11.70 kB
dashboard         |  8.76 kB
BUILD_EXIT=0
```

---

## Comprobación funcional

### Dashboard vs base de datos

Red al abrir `/` → `/dashboard`:
`GET /api/clientes`, `GET /api/tipos-producto`, `GET /api/productos`,
`GET /api/ventas` (**4 en paralelo**).

| KPI        | Pantalla      | PostgreSQL (`status = 'active'`)            |
| ---------- | ------------- | ------------------------------------------- |
| Clientes   | 10            | 10                                          |
| Tipos      | 25            | 25                                          |
| Productos  | 16            | 16                                          |
| Ingresos   | $243,824.86   | `sum(total)` = 243824.86                    |
| Stock bajo | 2 filas       | `quantity <= min_stock` → 2                 |

«Últimas ventas» ordena por `sale_date` descendente (#13, #11, #2, #4, #8).

### Detalle

| Comprobación                         | Resultado observado                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| «Ver detalle» de la venta #11        | `GET /api/detalle-ventas` → «Detergente Textil 5L · 3 · $45,900.00 · $137,700.00», «3 unidades en 1 líneas» |
| `/detalle-ventas`                    | 26 líneas con nombre de producto y venta                                         |
| Editar línea                         | solo `Cantidad` editable; venta, producto y estado bloqueados                    |
| Guardar cantidad 2                   | `PATCH /api/detalle-ventas/1` → **403** y toast de error                         |

> El `403` es el comportamiento que la guía anuncia en §7.1 («Frontera con
> Fase II»): el catálogo RBAC del backend **solo concede
> `GET /api/detalle-ventas`**, incluso al admin. ISS-09 ocultará esos botones.

---

## Checklist de cierre de Fase I

| Pantalla           | Listar | Crear | Editar | Baja lógica | Notas                                    |
| ------------------ | ------ | ----- | ------ | ----------- | ---------------------------------------- |
| Clientes (ISS-03)  | ✅     | ✅    | ✅     | ✅          |                                          |
| Tipos (ISS-04)     | ✅     | ✅    | ✅     | ✅          |                                          |
| Productos (ISS-05) | ✅     | ✅    | ✅     | ✅          |                                          |
| Ventas (ISS-06)    | ✅     | ✅    | —      | 403         | catálogo RBAC sin `deactivate`           |
| Detalle (ISS-07)   | ✅     | 403   | 403    | 403         | catálogo RBAC solo `GET`                 |
| Dashboard (ISS-07) | ✅     | —     | —      | —           | KPIs = BD                                |

- ✅ `ng build` sin errores ni warnings de presupuesto.
- ✅ Todas las rutas funcionan por URL directa dentro del Shell.
- ⚠️ «Fase I sin autenticación» no es posible con este backend (no tiene
  `AUTH_ENABLED`); las capturas usan token inyectado. ISS-08 lo resuelve.

---

## Evidencias (capturas)

| #   | Archivo                                                                                    | Bloque                       |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------- |
| 1   | [`imagenes/iss-07-01-dashboard.png`](imagenes/iss-07-01-dashboard.png)                     | dashboard                    |
| 2   | [`imagenes/iss-07-02-detalle-venta.png`](imagenes/iss-07-02-detalle-venta.png)             | `SaleDetail` de la venta #11 |
| 3   | [`imagenes/iss-07-03-detalle-ventas.png`](imagenes/iss-07-03-detalle-ventas.png)           | listado de líneas            |
| 4   | [`imagenes/iss-07-04-editar-linea.png`](imagenes/iss-07-04-editar-linea.png)               | edición: solo cantidad       |
| 5   | [`imagenes/iss-07-05-escritura-403.png`](imagenes/iss-07-05-escritura-403.png)             | 403 al escribir              |
| 6   | [`imagenes/iss-07-06-dashboard-movil.png`](imagenes/iss-07-06-dashboard-movil.png)         | dashboard en móvil           |

---

## Cierre

- ✅ Detalle de ventas listado con nombres; edición limitada a `quantity`.
- ✅ `SaleDetail` integrado en `SaleList` con líneas reales.
- ✅ Dashboard: 4 peticiones en paralelo y KPIs idénticos a la BD.
- ✅ build `0` · 115/115 pruebas · 6 capturas.

Siguiente: **ISS-08 · Autenticación JWT, perfil y permisos efectivos** (Fase II).
