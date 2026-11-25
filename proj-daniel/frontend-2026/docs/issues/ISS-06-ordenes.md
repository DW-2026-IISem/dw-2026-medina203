# ISS-06 · Órdenes de servicio transaccionales — TextilClean

**Bloqueado por:** ISS-05. **Habilita:** ISS-07.

## Objetivo

Registrar la ropa que entrega un cliente como una **orden de servicio** con varias
líneas, en un solo `POST` transaccional, y seguir su avance en la planta.

## Registro (`/ordenes/nueva` · `ServiceOrderForm`)

1. Se elige la empresa cliente (búsqueda por razón social o NIT) y se escriben notas.
2. Se agregan líneas al **borrador** (signals): servicio, número de prendas y peso.
   - Servicio por **kg** → el peso es obligatorio; total = precio × peso.
   - Servicio por **unidad** → total = precio × prendas.
3. Subtotal, impuesto, descuento, total y **entrega estimada** (mayor `estimated_hours`)
   se recalculan con `computed()` con la misma regla que usa el backend.
4. «Registrar orden» envía **un solo** `POST /api/ordenes` con todas las líneas; el backend
   congela los precios y guarda orden + líneas en una transacción.

Validaciones en la UI: cliente obligatorio, al menos una línea, prendas enteras ≥ 1, peso
para servicios por kg y descuento ≤ subtotal + impuesto. Si el backend rechaza (cliente o
servicio inactivo), el mensaje se muestra en la página y en un toast.

## Listado (`/ordenes` · `ServiceOrderList`)

- Filtros por **estado del proceso** y por **cliente**, enviados al backend como query params.
- Etiqueta de color por estado (`ProcessStatusTag`) y suma de los totales visibles.
- Botón para **avanzar un paso** (`PATCH /api/ordenes/:id/estado`): Recibida → En proceso →
  Lista → Entregada. Una orden entregada ya no ofrece avanzar ni anular.
- **Anular** (borrado lógico de la orden y sus líneas) y **eliminar** con confirmación.

## Criterios de aceptación

- [x] Borrador con totales reactivos y regla kg / unidad
- [x] Un único POST transaccional con todas las líneas
- [x] Listado con filtros, avance de estado, anulación y eliminación
- [x] Pruebas de cálculo, validaciones, payload, filtros y avance de estado
