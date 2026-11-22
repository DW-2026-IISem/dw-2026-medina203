# ISS-09 · Auth base: seguridad y modelos — TextilClean

**Fase II:** Auth con RBAC. **Bloqueado por:** Cierre Fase I. **Habilita:** ISS-10.

## Objetivo

Preparar la base de seguridad: utilidades de JWT y contraseñas, y las 6 tablas de
auth con sus relaciones. Todavía no se protege ninguna ruta.

## Comandos

```bash
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
# Agregar a .env (ver .env.example):
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"   # → JWT_SECRET
```

| Variable | Uso |
|---|---|
| `JWT_SECRET` | Firma HS256 (mínimo 32 caracteres) |
| `JWT_ACCESS_TTL` | Vida del access token en segundos (900) |
| `JWT_REFRESH_TTL_DAYS` | Vida del refresh token en días (7) |

## Utilidades (`src/shared/auth/`)

| Archivo | Responsabilidad |
|---|---|
| `jwt.ts` | `signAccessToken`, `verifyAccessToken` (iss `app-textilclean-express`, aud `app-textilclean-api`, `exp`, `jti`), `extractBearerToken` |
| `password.ts` | `hashPassword`/`comparePassword` (bcrypt, 12 rondas), `sha256Hex`, `generateOpaqueToken` |
| `resource-match.ts` | `normalizePath`, `pathMatches` (`/api/ordenes/:id` ≈ `/api/ordenes/7`), `isOperationGranted` |
| `auth-user.ts` | Tipo `req.auth` y `requireAuthUser(req)` |
| `../http/swagger-security.ts` | `bearerAuth`, respuestas 401/403 para Swagger |

## Tablas de auth

| Tabla | Campos clave |
|---|---|
| `users` | `username` único, `full_name`, `email` único, `password` (hash bcrypt), `avatar`, `status` |
| `roles` | `name` único en MAYÚSCULAS (`ADMIN`, `OPERATOR`), `description`, `status` |
| `resources` | `method` + `path` (únicos juntos), `description`, `status` |
| `role_users` | `user_id`, `role_id` (únicos juntos), `status` |
| `resource_roles` | `role_id`, `resource_id` (únicos juntos), `status` — **es el permiso** |
| `refresh_tokens` | `user_id`, `token_hash` único, `family_id`, `device_info`, `expires_at`, `status` |

`users` son el **personal de la lavandería**; las empresas atendidas siguen en `customers`.

Relaciones en `features/auth/rbac.associations.ts`: User N:M Role (vía `role_users`),
Role N:M Resource (vía `resource_roles`), User 1:N RefreshToken.

## Criterios de aceptación

- [x] Dependencias instaladas y variables JWT en `.env.example`
- [x] Utilidades de seguridad en `shared/auth`
- [x] 6 modelos de auth + asociaciones importados en `config` y en el SeedersRunner
- [x] `npm run dev` crea las 11 tablas
- [x] `npx tsc --noEmit` sin errores
