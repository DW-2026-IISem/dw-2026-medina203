# ISS-03 · CRUD de clientes con Signals — TextilClean

**Bloqueado por:** ISS-02. **Habilita:** ISS-04.

## Objetivo

Primera pantalla de negocio: las **empresas cliente** de la lavandería (hoteles,
clínicas, restaurantes), con el patrón lista + formulario que reutilizan los demás CRUD.

## Contrato con el backend

| Acción | Petición |
|---|---|
| Listar activos | `GET /api/clientes` → `{ customers }` |
| Crear | `POST /api/clientes` (`business_name`, `tax_id`, `contact_name`, `phone`, `email`, `address`, `status`) |
| Editar | `PATCH /api/clientes/:id` (sin `status`) |
| Baja lógica | `PATCH /api/clientes/:id/deactivate` |
| Eliminar | `DELETE /api/clientes/:id` (409 si el cliente tiene órdenes) |

## Componentes

| Componente | Responsabilidad |
|---|---|
| `CustomerList` | Signals `rows`, `loading`, `error`, `filter`; `visibleRows` con `computed` + `filterRows`; diálogo de alta/edición; confirmaciones de baja y eliminación |
| `CustomerForm` | Formulario reactivo: razón social y teléfono obligatorios, **NIT** con patrón `900123456-7`, correo válido; el estado solo se elige al crear |

Ruta `/clientes` (carga diferida) y entrada «Clientes» en el menú.

## Probar contra el backend

Backend con `AUTH_ENABLED=false` (Fase I sin sesión) y `npm start` en el frontend:
crear una empresa, buscarla por NIT, editarla, desactivarla. Un NIT repetido muestra el
409 del backend en un toast.

## Criterios de aceptación

- [x] Lista con búsqueda por razón social, NIT, contacto, correo y teléfono
- [x] Alta y edición en diálogo con validaciones del dominio
- [x] Baja lógica y eliminación con confirmación
- [x] Pruebas de lista (carga, filtro, error, POST/PATCH) y formulario
