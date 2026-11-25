# ISS-13 · Middlewares de acceso y las 3 modalidades — TextilClean

**Bloqueado por:** ISS-12. **Habilita:** ISS-14.

## Objetivo

Proteger la API: cada ruta declara su **modalidad de acceso** y las peticiones
pasan por `authenticate` (identidad) y `authorize` (permiso RBAC).

## Las 3 modalidades (`features/auth/access/index.ts`)

| Modalidad | Middlewares | Rutas de TextilClean |
|---|---|---|
| **OPEN** | ninguno | `POST /api/sesion/login`, `/refresh`, `/logout` (ISS-15), `/api/docs` |
| **JWT** | `jwtOnly` = `[authenticate]` | perfil, permisos propios y sesiones propias (ISS-14/15) |
| **JWT + RBAC** | `protect` = `[authenticate, authorize]` | las 69 operaciones del catálogo (negocio + administración) |

## Middlewares

- **`authenticate`**: exige `Authorization: Bearer <token>`, verifica firma HS256, `iss`, `aud`
  y `exp`, y que el usuario siga activo. Deja `req.auth`. Falla → **401**.
- **`authorize`**: normaliza `METHOD /ruta`, busca los permisos efectivos del usuario y compara
  con `pathMatches` (`/api/ordenes/:id` cubre `/api/ordenes/7`).
  **Deny by default**: sin concesión activa → **403**. No usa caché: conceder o retirar un
  permiso aplica en la siguiente petición.

## Modo práctica

`AUTH_ENABLED=false` en `.env` desactiva ambos middlewares para demostrar la Fase I sin
sesión. Cualquier otro valor deja la seguridad activa. **Volver a `true` al cerrar.**

## Probar antes del login (ISS-15)

```bash
npm run dev:token -- admin       # imprime un access token de admin
npm run dev:token -- operador    # imprime un access token del operario
```

Pega el token en la variable `@token` de los archivos `.http` (todas las peticiones ya
envían `Authorization: Bearer {{token}}`).

## Resultado esperado

| Petición | Sin token | admin | operador |
|---|---|---|---|
| `GET /api/clientes` | 401 | 200 | 200 |
| `GET /api/usuarios` | 401 | 200 | **403** |
| `DELETE /api/clientes/:id` | 401 | 200/404 | **403** |
| `PATCH /api/servicios/:id` (precio) | 401 | 200 | **403** |
| `PATCH /api/ordenes/:id/estado` | 401 | 200 | 200 |

## Swagger: secure by default

El documento declara `security: [bearerAuth]` global y agrega 401/403 a cada operación.
Las operaciones OPEN declaran `security: []`; las JWT-only se marcan con `x-access: "jwt"` (solo 401).

## Criterios de aceptación

- [x] `authenticate` y `authorize` con 401/403
- [x] Las 69 operaciones protegidas con `protect` (coinciden con el catálogo)
- [x] Interruptor `AUTH_ENABLED`
- [x] Swagger con `bearerAuth` y respuestas 401/403
- [x] `.http` con cabecera `Authorization`
