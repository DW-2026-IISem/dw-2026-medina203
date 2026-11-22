# ISS-10 · Feature Users (identidad y contraseña) — TextilClean

**Bloqueado por:** ISS-09. **Habilita:** ISS-11.

## Objetivo

CRUD del **personal de la lavandería** que usará el sistema (administradores y
operarios), con contraseñas seguras.

## Endpoints — `/api/usuarios` (sin middlewares hasta ISS-13)

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/usuarios` | Listar activos (sin `password`) |
| GET | `/api/usuarios/:id` | Obtener uno |
| POST | `/api/usuarios` | Crear (409 si username/email existen) |
| PUT | `/api/usuarios/:id` | Reemplazar username, full_name, email, avatar |
| PATCH | `/api/usuarios/:id` | Parcial |
| DELETE | `/api/usuarios/:id` | Borrado físico |
| PATCH | `/api/usuarios/:id/deactivate` | Borrado lógico |
| PATCH | `/api/usuarios/:id/password` | Cambiar contraseña verificando la actual |

## Reglas

- `username` (3-80) y `email` se normalizan a minúsculas y son únicos → **409**.
- La contraseña (mín. 8) se hashea con bcrypt en los hooks del modelo; nunca sale en la respuesta.
- El repository excluye la columna `password` salvo en `findByIdWithPassword` /
  `findByIdentifierWithPassword` (usados en cambio de contraseña y login).
- `status` solo cambia por `/deactivate`.

## Seeder

Usuarios canónicos (solo desarrollo):

| Usuario | Contraseña | Rol (ISS-12) |
|---|---|---|
| `admin` | `Admin123!` | ADMIN |
| `operador` | `Operador123!` | OPERATOR |

`--users=N` completa con operarios falsos hasta N usuarios.

## Criterios de aceptación

- [x] DTOs, repository, service, controller, routes, swagger y `.http`
- [x] Contraseña hasheada y nunca expuesta
- [x] Cambio de contraseña con verificación de la actual
- [x] Seeder determinista de `admin` y `operador`
