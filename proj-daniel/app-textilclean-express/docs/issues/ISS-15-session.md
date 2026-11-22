# ISS-15 · Feature Session (login y perfil) — TextilClean

**Bloqueado por:** ISS-14. **Habilita:** Cierre Fase II.

## Objetivo

Que el personal de la lavandería inicie sesión, renueve su sesión sin volver a
escribir la contraseña, la cierre y consulte su perfil y permisos (lo que la UI
necesita para mostrar u ocultar opciones).

## Endpoints

| Modalidad | Método | Ruta | Respuesta |
|---|---|---|---|
| OPEN | POST | `/api/sesion/login` | `{ access_token, token_type, expires_in, refresh_token, refresh_expires_in }` |
| OPEN | POST | `/api/sesion/refresh` | Nuevo par de tokens (rota el refresh) |
| OPEN | POST | `/api/sesion/logout` | Revoca el refresh token |
| JWT | GET | `/api/sesion/perfil` | `{ user: { id, username, full_name, email, avatar, status, roles } }` |
| JWT | GET | `/api/permisos` | `{ permissions: [{ method, path, role_name, … }] }` |

- `identifier` acepta **username o email**.
- Login fallido → **401 "Invalid credentials"** sin revelar si falló el usuario, el estado o la contraseña.
- Refresh con un token ya usado → **401** y se revoca toda la familia de sesiones.
- Si el usuario fue desactivado, el refresh falla y se revocan sus sesiones.

## Flujo completo (`session/http/session.http`)

1. Login `admin / Admin123!` → REST Client guarda `access_token` y `refresh_token`.
2. `GET /api/sesion/perfil` → roles `["ADMIN"]`.
3. `GET /api/permisos` → 69 permisos (el operario ve 17).
4. Refresh → nuevos tokens; reusar el viejo → 401.
5. Logout.

## Credenciales de laboratorio

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | ADMIN |
| `operador` | `Operador123!` | OPERATOR |

## Criterios de aceptación

- [x] Login, refresh con rotación, logout (OPEN, `security: []` en Swagger)
- [x] Perfil con roles y permisos propios (JWT)
- [x] Swagger y `.http` con captura automática de tokens
