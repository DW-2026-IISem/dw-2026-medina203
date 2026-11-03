# ISS-08 · Autenticación JWT, perfil y permisos efectivos — Registro de verificación

**Fecha:** 03-nov-2026
**Proyecto:** `front-textilclean-express` (carpeta `frontend-2026`)
**Guía:** [`ISS-08 FRONTEND-TEXTILCLEAN-EXPRESS.md`](ISS-08%20FRONTEND-TEXTILCLEAN-EXPRESS.md)
**Estado:** ✅ Código, build, pruebas, sesión real contra el backend y capturas OK

> Entorno: el mismo de [ISS-04](iss-04-verificacion.md#entorno-de-esta-verificación).
> **Desde esta ISS las capturas ya no inyectan token**: la propia app hace
> login, guarda la sesión y añade el `Bearer` con su interceptor.

---

## 8.1 · Contrato real (comprobado con curl)

| Endpoint                 | Respuesta observada                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/sesion/login` | `{ access_token, token_type: "Bearer", expires_in: 900, refresh_token, refresh_expires_in }` (cuerpo `{ identifier, password }`) |
| `GET /api/sesion/perfil` | `{"user":{"id":1,"username":"admin","email":"admin@textilclean.local","avatar":null,"status":"active"}}`                         |
| `GET /api/permisos`      | `{ permissions: [ { resource_id, method, path, description, role_id, role_name } ] }` — 58 para admin                            |

## 8.2 · Activar Fase II

- Backend: **no hay** `AUTH_ENABLED`; el backend ya protege todas las rutas
  de negocio (Fase II siempre activa).
- Frontend: `requireAuth: true` ya estaba en ambos `environment*.ts` desde
  ISS-02. **No se sobrescribieron**: la guía los reescribe con
  `apiUrl: 'http://localhost:4000/api'`, y el backend real escucha en `:3000`.

## 8.3 · Modelos

- `auth.model.ts` reemplazado por el de la guía (`LoginRequest`,
  `SessionTokens`, `ProfilePayload`, `EffectivePermission`,
  `PermissionsPayload`, `AccessPayload`).
- `user.model.ts`, `role.model.ts`, `resource.model.ts` **conservados** (ISS-02):
  el `User` real tiene `avatar` y no `first_name/last_name` (ver corrección 1).

## 8.4 – 8.7 · Servicios e interceptores

| Archivo                                  | Estado                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| `app.config.ts`                          | ✅ `provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))` |
| `core/services/session-store.ts`         | ✅ signals + `localStorage['textilclean.session.v1']`                         |
| `core/services/auth.ts`                  | ✅ login → `forkJoin(perfil, permisos)` → `setAccess`                         |
| `core/interceptors/auth-interceptor.ts`  | ✅ `Bearer`, `refreshInFlight ??=`, `shareReplay`, `finalize`                 |
| `core/interceptors/error-interceptor.ts` | ✅ toast 0/403/5xx                                                            |

## 8.8 – 8.10 · Login, perfil, forbidden y rutas

- `/login`, `/forbidden` y `/construir` quedan **fuera** del Shell.
- `/perfil` dentro del Shell; «Mi perfil» añadido al menú.
- `login.ts` valida `returnUrl` (`startsWith('/')` y no `/login`).

---

## Bloque de verificación de la guía

```text
# 1. modelos
11:export interface SessionTokens {
25:export interface EffectivePermission {
40:export interface AccessPayload {
# 2. SessionStore persiste permisos
164:      permissions: this._permissions(),
# 3. AuthService
51:          this.me().pipe(
62:    return forkJoin({
70:      tap((access) => this.session.setAccess(access)),
# 4. single-flight
59:      refreshInFlight ??= auth.refresh().pipe(
64:        finalize(() => {
67:        shareReplay({ bufferSize: 1, refCount: false }),
# 5. returnUrl
55:          this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
57:          requested.startsWith('/') && !requested.startsWith('/login')
# 7. interceptores
33:    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
# 8. requireAuth
src/environments/environment.development.ts:11:  requireAuth: true,
src/environments/environment.ts:17:  requireAuth: true,
```

## Pruebas y build

La guía no trae pruebas para la sesión; se añadieron dos archivos:

| Archivo                                      | Casos | Qué cubre                                                                                                              |
| -------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| `core/services/session-store.spec.ts`        | 4     | persistencia con 4 claves, `can()` con `:id`, restore/clear, JSON corrupto                                             |
| `core/interceptors/auth-interceptor.spec.ts` | 4     | `Bearer` (no en login), **un solo refresh para 3×401** y reintento, sin refresh → `/login`, refresh fallido → `/login` |

```
 Test Files  25 passed (25)
      Tests  123 passed (123)
TEST_EXIT=0

Initial total | 577.82 kB | 135.49 kB
login         |  29.82 kB
BUILD_EXIT=0
```

---

## Correcciones respecto al código de la guía

| #   | Error / problema                                                                 | Corrección                                                               |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | `TS2339: Property 'first_name' does not exist on type 'User'` (profile.html)     | la fila «Nombre» pasa a «Avatar» (`user.avatar`), campo real del backend |
| 2   | `environment*.ts` con `:4000`                                                    | no se sobrescribieron (`:3000`)                                          |
| 3   | §8.10.2 reemplaza `shell.ts` por una versión sin `isDesktop`/Toast/ConfirmDialog | solo se añadió «Mi perfil» al array                                      |

### Incidencia: `ng serve` con build roto

La primera comprobación en el navegador **no** redirigía al login: `ng serve`
seguía sirviendo el bundle previo porque el build incremental había fallado con
el error 1 y no se recuperó tras corregirlo. Se reinició `ng serve` y el
comportamiento fue el esperado. **Regla:** si el navegador no refleja un cambio,
mirar el log de `ng serve` antes de depurar el código.

---

## Comprobación funcional (navegador real, sin inyección)

| Criterio                                                     | Resultado observado                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `/construir` sin sesión                                      | abre; **0 peticiones** al backend (ni perfil, ni permisos, ni refresh)                                             |
| `/dashboard` sin sesión                                      | 4×`401` → `/login?returnUrl=%2Fdashboard`                                                                          |
| Credenciales malas                                           | `POST /api/sesion/login` → `401`; mensaje «Invalid credentials»                                                    |
| Login `admin / Admin123!`                                    | `POST login` → `GET perfil [Bearer]` + `GET permisos [Bearer]` → vuelve a `/dashboard` y sus 4 GET llevan `Bearer` |
| Local Storage `textilclean.session.v1`                       | claves `accessToken`, `refreshToken`, `user`, `permissions` (58)                                                   |
| `/perfil`                                                    | usuario, email, rol **ADMIN** y tabla «Permisos efectivos (58)»                                                    |
| Access vencido (token corrompido) + 4 peticiones simultáneas | 4×`401` → **1** `POST /api/sesion/refresh` → 4 reintentos con `Bearer` nuevo; refresh rotado en storage            |
| Logout («Salir» en perfil)                                   | `POST /api/sesion/logout` → `/login`; `localStorage.getItem(...)` = `null`                                         |

> La clave se llama `textilclean.session.v1` (la guía menciona
> `storelab.session.v1` en los criterios, pero su propio `session-store.ts`
> usa `textilclean.session.v1`).

### Refresh, _reuse detection_ y logout (curl)

```text
1) login → refresh R0=_lW2aY9z…
2) refresh(R0) → R1=hcIU_p29… (rota)
3) reusar R0 → {"error":"Refresh token reuse detected: session family revoked"} HTTP 401
   R1 tras reuse (familia revocada) → … HTTP 401
4) logout(R2) → {"message":"Session closed"} HTTP 200
   logout(R2) otra vez → {"message":"Session closed"} HTTP 200   ← idempotente
   refresh(R2) → … HTTP 401                                      ← ya no sirve
```

---

## Evidencias (capturas)

| #   | Archivo                                                                                      | Bloque                       |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | [`imagenes/iss-08-01-construir-sin-sesion.png`](imagenes/iss-08-01-construir-sin-sesion.png) | `/construir` sin sesión      |
| 2   | [`imagenes/iss-08-02-redirige-login.png`](imagenes/iss-08-02-redirige-login.png)             | redirección con `returnUrl`  |
| 3   | [`imagenes/iss-08-03-login-error.png`](imagenes/iss-08-03-login-error.png)                   | credenciales inválidas       |
| 4   | [`imagenes/iss-08-04-login-ok.png`](imagenes/iss-08-04-login-ok.png)                         | dashboard tras login         |
| 5   | [`imagenes/iss-08-05-perfil.png`](imagenes/iss-08-05-perfil.png)                             | perfil y permisos efectivos  |
| 6   | [`imagenes/iss-08-06-refresh.png`](imagenes/iss-08-06-refresh.png)                           | dashboard tras refresh único |
| 7   | [`imagenes/iss-08-07-logout.png`](imagenes/iss-08-07-logout.png)                             | login tras logout            |

---

## Cierre

- ✅ `/dashboard` sin sesión → `/login?returnUrl=/dashboard`.
- ✅ Login guarda tokens y carga perfil + permisos.
- ✅ Local Storage con `accessToken`, `refreshToken`, `user`, `permissions`.
- ✅ Cada petición protegida lleva `Authorization: Bearer …`.
- ✅ Un `401` dispara **un** refresh compartido y se reintenta.
- ✅ Logout borra el storage y el refresh deja de servir.
- ✅ build `0` · 123/123 pruebas · 7 capturas.

Siguiente: **ISS-09 · Guards y RBAC estructural en la UI**.
