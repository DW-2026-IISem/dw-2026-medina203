# ISS-05 · Productos con relación a tipos — Registro de verificación

**Fecha:** 03-nov-2026
**Proyecto:** `front-textilclean-express` (carpeta `frontend-2026`)
**Guía:** [`ISS-05 FRONTEND-TEXTILCLEAN-EXPRESS.md`](ISS-05%20FRONTEND-TEXTILCLEAN-EXPRESS.md)
**Estado:** ✅ Código, build, pruebas, comprobación funcional y capturas OK

> Entorno: el mismo de [ISS-04](iss-04-verificacion.md#entorno-de-esta-verificación)
> (contenedor en la nube, backend `:3000` sobre PostgreSQL, capturas con
> Chromium headless y token inyectado por el script de capturas).

---

## 5.1 · Modelo

`product.model.ts` ya existía (ISS-02) con `min_stock`, `quantity` y
`product_type_id`, y con `Money`/`Timestamps` importados de `api.model.ts`.
**No se sobrescribió** (la versión de la guía redefinía `Money` y
`Timestamps`). Se añadió `ProductPayload`, que es lo que emite el formulario.

## 5.2 – 5.3 · Componentes y servicio

| Archivo                               | Estado                                                         |
| ------------------------------------- | -------------------------------------------------------------- |
| `products/product-api.ts`             | ✅ `/productos`, envolturas `products` / `product`             |
| `products/product-api.spec.ts`        | ✅ 6 casos                                                     |
| `product-form/product-form.{ts,html}` | ✅ `p-select` de tipos con `optionValue="id"`, `p-inputnumber` |
| `product-form/product-form.spec.ts`   | ✅ 7 casos                                                     |
| `product-list/product-list.{ts,html}` | ✅ `forkJoin` + `typeName` (Map) + `lowStockCount`             |
| `product-list/product-list.spec.ts`   | ✅ 10 casos                                                    |
| `*.css`                               | ✅ vacíos                                                      |

## 5.4 – 5.5 · Carga paralela, mapa de nombres y stock bajo

```text
11:import { forkJoin } from 'rxjs';
57:  readonly visibleRows = computed(() =>
65:  readonly typeName = computed(() => {
70:  readonly lowStockCount = computed(
90:    forkJoin({
```

Al abrir `/productos` salen **dos peticiones en paralelo**:
`GET /api/productos` y `GET /api/tipos-producto`.

## 5.6 · `optionValue="id"`

```text
product-form.html:49:      optionValue="id"
```

El `p-select` guarda en el control el **número** `id` del tipo, no el objeto:
el payload lleva `product_type_id: 5`, que es exactamente lo que valida el DTO
del backend. Con el objeto completo el backend respondería `400`.

## 5.8 · Ruta y menú

`/productos` lazy en `app.routes.ts` y «Productos» (`pi pi-box`) en
`shell.ts` (se añadió al array `items`, sin reemplazar el archivo).

---

## Pruebas y build

```
 Test Files  16 passed (16)
      Tests  86 passed (86)
TEST_EXIT=0

Initial total      | 561.24 kB | 130.70 kB
chunk-eSh3XlRR.js  | product-list | 15.24 kB
BUILD_EXIT=0
```

### Corrección en `product-list.spec.ts`

El caso _«should show an error message when GET fails»_ fallaba:

```
Error: Cannot flush a cancelled request.
 ❯ src/app/features/products/product-list/product-list.spec.ts:90:8
```

`forkJoin` **cancela** la otra petición en cuanto una falla, así que no se puede
responder a `/productos` después del `500` de `/tipos-producto`. El spec ahora
comprueba ese comportamiento:

```ts
const tipos = http.expectOne(TYPES_URL);
const productos = http.expectOne(PRODUCTS_URL);
tipos.flush({ error: 'x' }, { status: 500, statusText: 'Error' });
// forkJoin cancela la otra petición en cuanto una falla.
expect(productos.cancelled).toBe(true);
```

---

## Comprobación funcional

| Comprobación                             | Resultado observado                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `/productos` por URL directa             | `GET /api/productos` + `GET /api/tipos-producto`; «15 activos», «2 con stock bajo» |
| Columna Tipo                             | **nombre** del tipo (`Movies`, `Grocery`…), no el id                               |
| Precio                                   | formateado con `currency` (`$45,900.00`)                                           |
| Crear «Detergente Textil 5L» (stock 2/4) | `POST /api/productos` → «16 activos», «3 con stock bajo»                           |
| Editar                                   | el `p-select` abre con «Grocery» seleccionado; `status` bloqueado                  |
| Guardar cantidad 30                      | `PATCH /api/productos/16` → «2 con stock bajo» (el contador sigue al semáforo)     |
| Tipo inactivo (curl, tipo 26)            | `400 {"error":"Product type must be active"}`                                      |
| Solo tipos activos en el select          | el tipo 26 (dado de baja en ISS-04) no aparece como opción                         |
| Móvil 390 px                             | encabezado apilado, tabla con scroll horizontal                                    |

```bash
curl -s -X POST localhost:3000/api/productos -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"name":"X","brand":"Y","price":10,"min_stock":1,"quantity":5,"product_type_id":26}'
# {"error":"Product type must be active"}  HTTP 400

curl -s localhost:3000/api/productos/16 -H "$AUTH"
# {"product":{"id":16,"name":"Detergente Textil 5L","brand":"TextilClean","price":"45900.00",
#   "min_stock":4,"quantity":30,"product_type_id":5,"status":"active",…}}
```

> `price` llega como **string** (`"45900.00"`, `DECIMAL`): el modelo lo declara
> `Money = number | string` y la lista lo pasa por `Number()` antes de
> formatearlo.

### Hallazgo en el backend

La guía dice que el backend valida `price > 0`, pero
`POST /api/productos` con `"price": 0` respondió **`201`**. El formulario sí lo
impide (`Validators.min(0.01)`), así que la UI no puede enviarlo; el registro de
prueba (id 17) se borró. Queda anotado para el backend.

---

## Evidencias (capturas)

| #   | Archivo                                                                                      | Bloque                         |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | [`imagenes/iss-05-01-lista.png`](imagenes/iss-05-01-lista.png)                               | lista con tipo, precio y stock |
| 2   | [`imagenes/iss-05-02-formulario.png`](imagenes/iss-05-02-formulario.png)                     | alta con `p-select` de tipos   |
| 3   | [`imagenes/iss-05-03-creado.png`](imagenes/iss-05-03-creado.png)                             | creado con stock bajo          |
| 4   | [`imagenes/iss-05-04-editar-conserva-tipo.png`](imagenes/iss-05-04-editar-conserva-tipo.png) | edición conserva el tipo       |
| 5   | [`imagenes/iss-05-05-editado.png`](imagenes/iss-05-05-editado.png)                           | `PATCH` y contador actualizado |
| 6   | [`imagenes/iss-05-06-movil.png`](imagenes/iss-05-06-movil.png)                               | vista móvil                    |

---

## Diferencias respecto a la guía

| #   | Guía                                        | Este proyecto                              | Motivo                            |
| --- | ------------------------------------------- | ------------------------------------------ | --------------------------------- |
| 1   | modelo redefine `Money` y `Timestamps`      | se reutilizan los de `api.model.ts`        | evitar tipos duplicados           |
| 2   | spec de error responde a las dos peticiones | verifica que `forkJoin` cancela la segunda | comportamiento real de `forkJoin` |
| 3   | reemplazar `shell.ts`                       | se añade la entrada al array               | conservar el Shell de ISS-02      |
| 4   | `spyOn` / `icon="pi …"`                     | `vi.spyOn` / `<i pButtonIcon>`             | igual que en ISS-04               |

---

## Cierre

- ✅ Listado con nombre, marca, tipo (texto), precio formateado y stock.
- ✅ El formulario solo ofrece tipos activos.
- ✅ Tipo inactivo → `400 Product type must be active`, mostrado con `toApiMessage`.
- ✅ Editar conserva `product_type_id` numérico.
- ✅ `lowStockCount()` coincide con las filas marcadas.
- ✅ build `0` sin warnings de presupuesto · 86/86 pruebas · 6 capturas.

Siguiente: **ISS-06 · Ventas transaccionales y detalle**.
