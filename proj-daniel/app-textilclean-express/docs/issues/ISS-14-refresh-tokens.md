# ISS-14 · Feature RefreshTokens (sesiones) — TextilClean

**Bloqueado por:** ISS-13. **Habilita:** ISS-15.

## Objetivo

Manejar las **sesiones** del personal de la lavandería con refresh tokens
seguros, y permitir que cada usuario vea y cierre sus propias sesiones
(por ejemplo, el computador de recepción y el celular del operario).

## Diseño del refresh token

| Propiedad | Cómo se cumple |
|---|---|
| **Opaco** | 64 bytes aleatorios (`generateOpaqueToken`), no es un JWT |
| **Hasheado** | En `refresh_tokens.token_hash` solo se guarda su SHA-256 |
| **Rotativo** | Cada uso lo invalida y emite otro de la misma `family_id` |
| **Detección de reuso** | Si llega un token ya rotado/revocado, se revoca **toda la familia** |
| **Revocable** | Logout, revocar una sesión o todas |
| **Con vencimiento** | `expires_at` = ahora + `JWT_REFRESH_TTL_DAYS` (7) |

El login (ISS-15) es quien crea las filas; esta tabla no tiene seeder.

## Endpoints — modalidad **JWT** (sin RBAC)

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/sesiones` | Mis sesiones activas (sin `token_hash`, con `is_expired`) |
| GET | `/api/sesiones/:id` | Una sesión mía (404 si es de otro usuario) |
| PATCH | `/api/sesiones/:id/deactivate` | Revocar una sesión mía |
| PATCH | `/api/sesiones/deactivate-all` | Revocar todas mis sesiones |
| DELETE | `/api/sesiones` | Purgar mis sesiones revocadas o expiradas |

Son operaciones sobre **mis propios** datos, así que no requieren permiso RBAC ni
aparecen en el catálogo de recursos. En Swagger se marcan con `x-access: "jwt"`.

## Criterios de aceptación

- [x] Repository, service (issue, rotate, revoke), controller, routes, swagger y `.http`
- [x] Token opaco, hasheado, rotativo y revocable con detección de reuso
- [x] Rutas protegidas solo con `authenticate`
