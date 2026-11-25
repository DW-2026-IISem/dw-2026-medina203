# ISS-07 · Detalle de órdenes, panel y cierre de la Fase I — TextilClean

**Bloqueado por:** ISS-06. **Cierra:** Fase I. **Habilita:** ISS-08.

## Objetivo

Completar la operación de la planta: ver el detalle de cada orden, corregir sus líneas
y tener un panel con el estado del día.

## Detalle de una orden

En `/ordenes`, el botón 👁 abre un diálogo con `ServiceOrderDetail` (presentacional):
`GET /api/ordenes/:id` ya trae el cliente y las líneas activas con su servicio, precio
congelado, prendas, peso, total de línea y los totales de la orden.

## Detalle de órdenes (`/detalle-ordenes`)

`ServiceOrderItemList` + `ServiceOrderItemForm`:

- Todas las líneas activas, filtrables por orden, con suma de los totales visibles.
- **Agregar línea** a una orden abierta (`POST /api/detalle-ordenes`); el peso es
  obligatorio en servicios por kg.
- **Editar** solo prendas y peso (`PATCH` con `{ quantity, weight_kg }`): el servicio y el
  precio congelado no cambian.
- Quitar (baja lógica) o eliminar la línea. Cada cambio recalcula el total de la orden.
- Las líneas de órdenes **entregadas** no muestran acciones (el backend respondería 409).

## Panel (`/panel`, ruta inicial)

Tres consultas en paralelo (`forkJoin`: clientes, servicios, órdenes) y `buildDashboard`,
una función pura que calcula: órdenes en planta y valor por cobrar, listas para entregar,
valor entregado, órdenes por estado, **entregas vencidas** y últimas órdenes recibidas.

## Cierre de la Fase I

| Pantalla | Ruta | Endpoint |
|---|---|---|
| Panel | `/panel` | clientes + servicios + órdenes |
| Clientes | `/clientes` | `/api/clientes` |
| Tipos de prenda | `/tipos-prenda` | `/api/tipos-prenda` |
| Servicios | `/servicios` | `/api/servicios` |
| Órdenes | `/ordenes`, `/ordenes/nueva` | `/api/ordenes` |
| Detalle de órdenes | `/detalle-ordenes` | `/api/detalle-ordenes` |

Recorrido verificado en navegador contra el backend (`AUTH_ENABLED=false`): crear cliente →
nueva orden con una línea por kg (12,5 kg) y otra por unidad → el total de la UI coincide con
el del backend → avanzar a «En proceso» → ver detalle → revisar el detalle de órdenes.

> Los campos de peso usan `locale="es-CO"`: «12,5» se interpreta como 12.5 kg (con la
> configuración regional por defecto se leía como 125).

## Criterios de aceptación

- [x] Detalle de orden con líneas y totales
- [x] Gestión de líneas con recálculo de totales y bloqueo de órdenes entregadas
- [x] Panel con indicadores de la planta
- [x] 70 pruebas en verde y build sin errores
