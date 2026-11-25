# ISS-04 · CRUD de tipos de prenda — TextilClean

**Bloqueado por:** ISS-03. **Habilita:** ISS-05.

## Objetivo

Administrar el catálogo de **tipos de prenda** (sábanas, toallas, uniformes, batas
médicas…). Es el "padre" de los servicios: ISS-05 los relaciona.

## Contrato con el backend

`/api/tipos-prenda` → `{ garment_types }` / `{ garment_type }`; campos `name` (único) y
`description`. Baja lógica con `/deactivate`; eliminar devuelve 409 si hay servicios asociados.

## Componentes

- `GarmentTypeList`: mismo patrón de signals que clientes (carga, filtro, diálogo, confirmaciones).
- `GarmentTypeForm`: nombre obligatorio (≤ 80) y descripción opcional.

Ruta `/tipos-prenda` y entrada «Tipos de prenda» en el menú.

## Criterios de aceptación

- [x] Listado, búsqueda, alta, edición, baja lógica y eliminación
- [x] Nombre repetido → toast con el 409 del backend
- [x] Pruebas de lista y formulario
