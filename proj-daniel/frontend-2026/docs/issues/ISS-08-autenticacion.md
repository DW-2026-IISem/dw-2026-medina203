# ISS-08 · Autenticación JWT, perfil y permisos efectivos — TextilClean

**Fase II · Bloque 1 de 3 (sesión).** **Bloqueado por:** ISS-07. **Habilita:** ISS-09.

## Objetivo

Que el personal de la lavandería inicie sesión y que cada petición viaje con su token.
Desde aquí el backend vuelve a `AUTH_ENABLED=true`.

## Piezas

| Archivo | Responsabilidad |
|---|---|
| `core/services/session-store.ts` | Única fuente de verdad: tokens, usuario, permisos y derivados (`isAuthenticated`, `roleNames`, `displayName`, `can('PATCH', '/api/ordenes/15/estado')`). Persiste en `localStorage` (`textilclean.session.v2`). |
| `core/services/auth.ts` | `login` → tokens → `forkJoin(perfil, permisos)`; `me`, `refresh`, `logout` |
| `core/interceptors/auth-interceptor.ts` | Añade `Authorization: Bearer`; ante un 401 hace **un solo** refresh compartido por las peticiones concurrentes y reintenta; si falla, limpia y va a `/login?reason=expired` |
| `core/interceptors/error-interceptor.ts` | Toasts globales para sin conexión, 403 y 5xx |
| `features/auth/login` | Usuario o correo + contraseña; vuelve a `returnUrl` o al panel. Fuera de producción muestra los usuarios de laboratorio |
| `features/auth/profile` | Nombre completo, usuario, correo, estado, roles y tabla de permisos efectivos; recargar permisos y salir |
| `features/auth/forbidden` | Página 403 que muestra el permiso requerido (la usa ISS-09) |

## Contrato con el backend

| Endpoint | Modalidad | Uso |
|---|---|---|
| `POST /api/sesion/login` | OPEN | Devuelve solo el par de tokens |
| `GET /api/sesion/perfil` | JWT | `{ user }` con `full_name` y `roles` |
| `GET /api/permisos` | JWT | `{ permissions }` (método + ruta + rol) |
| `POST /api/sesion/refresh` | OPEN | Rota el refresh token |
| `POST /api/sesion/logout` | OPEN | Revoca el refresh token |

Usuarios: `admin / Admin123!` (ADMIN, 69 permisos) · `operador / Operador123!` (OPERATOR, 17).

## Criterios de aceptación

- [x] Login, perfil, permisos, refresh único con reintento y logout
- [x] Sesión persistida y restaurada al recargar
- [x] Pruebas de SessionStore, AuthService e interceptor
