# 🛠 ISS-15 · Feature Session (login, refresh, logout, perfil y permisos) — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase II:** Auth con RBAC.
**Feature / tabla:** `features/auth/session/` · cruza `users` y `refresh_tokens`.
**API:** `/api/sesion/*` y `/api/permisos` — **OPEN** y **JWT**.
**Depende de:** ISS-14 — Feature RefreshTokens.
**Habilita:** Cierre de Fase II.

**Objetivo:** exponer el punto de entrada al sistema (`login`), la renovación automática (`refresh` con rotación), la salida (`logout`), el perfil del usuario y sus permisos efectivos. Es el feature que demuestra que **las tres modalidades conviven sin fricción**.

---

## Criterios de aceptación (ISS-15)

- [ ] 20.1 `session/dto/` (`login.dto.ts`, `refresh-session.dto.ts`, `logout-session.dto.ts`, `session-response.dto.ts`, `index.ts`)
- [ ] 20.2 `session.service.ts`: `login`, `refresh`, `logout`, `profile`, `myPermissions`
- [ ] 20.3 `session.controller.ts` con `this.run(res, …)`
- [ ] 20.4 `session.routes.ts`: `login`/`refresh`/`logout` **OPEN**; `perfil`/`permisos` **JWT**
- [ ] 20.5 `session.swagger.ts` con `security: []` en OPEN y `bearerAuth` en JWT
- [ ] 20.6 Archivos `.http` de login, refresh y perfil
- [ ] 20.7 Recorrido E2E que prueba **OPEN → JWT → JWT + RBAC**
- [ ] `npx tsc --noEmit` OK

```bash
mkdir -p src/features/auth/session/dto
mkdir -p src/features/auth/session/http
```

---

## 20.1 DTOs

**`dto/login.dto.ts`**

```bash
: > src/features/auth/session/dto/login.dto.ts
cat >> src/features/auth/session/dto/login.dto.ts << 'EOF'
/** Datos de entrada de `POST /api/sesion/login` (modalidad OPEN). */
export interface LoginDto {
  identifier: string;
  password: string;
}
EOF
```

**`dto/refresh-session.dto.ts`**

```bash
: > src/features/auth/session/dto/refresh-session.dto.ts
cat >> src/features/auth/session/dto/refresh-session.dto.ts << 'EOF'
export interface RefreshSessionDto {
  refresh_token: string;
}
EOF
```

**`dto/logout-session.dto.ts`**

```bash
: > src/features/auth/session/dto/logout-session.dto.ts
cat >> src/features/auth/session/dto/logout-session.dto.ts << 'EOF'
export interface LogoutSessionDto {
  refresh_token: string;
}
EOF
```

**`dto/session-response.dto.ts`**

```bash
: > src/features/auth/session/dto/session-response.dto.ts
cat >> src/features/auth/session/dto/session-response.dto.ts << 'EOF'
export interface SessionTokensDto {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

export interface ProfileDto {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  status: "active" | "inactive";
}
EOF
```

**`dto/index.ts`**

```bash
: > src/features/auth/session/dto/index.ts
cat >> src/features/auth/session/dto/index.ts << 'EOF'
export * from "./login.dto";
export * from "./refresh-session.dto";
export * from "./logout-session.dto";
export * from "./session-response.dto";
EOF
```

---

## 20.2 Service

```bash
: > src/features/auth/session/session.service.ts
cat >> src/features/auth/session/session.service.ts << 'EOF'
import {
  LoginDto,
  LogoutSessionDto,
  ProfileDto,
  RefreshSessionDto,
  SessionTokensDto,
} from "./dto";
import { UsersRepository } from "../users/users.repository";
import { RefreshTokensService } from "../refresh-tokens/refresh-tokens.service";
import { ResourceRolesService } from "../resource-roles/resource-roles.service";
import { EffectivePermissionDto } from "../resource-roles/dto";
import { User } from "../users/user.model";
import { AppError } from "../../../shared/errors/app-error";
import { comparePassword } from "../../../shared/auth/password";
import { ACCESS_TOKEN_TTL_SECONDS, signAccessToken } from "../../../shared/auth/jwt";

/**
 * Capa Service del feature Session — **el ciclo de vida de la sesión**.
 *
 * | Operación | Modalidad | Escribe seguridad |
 * |---|---|---|
 * | `login`    | OPEN (valida credenciales) | `refresh_tokens` (nueva familia) |
 * | `refresh`  | OPEN (credencial de sesión) | `refresh_tokens` (rotación) |
 * | `logout`   | OPEN (credencial de sesión) | `refresh_tokens` (revocación) |
 * | `profile`  | JWT | — (solo lectura) |
 * | `myPermissions` | JWT | — |
 */
export class SessionService {
  public constructor(
    private readonly usersRepository: UsersRepository = new UsersRepository(),
    private readonly refreshTokensService: RefreshTokensService = new RefreshTokensService(),
    private readonly resourceRolesService: ResourceRolesService = new ResourceRolesService()
  ) {}

  // ================== LOGIN (OPEN) ==================
  public async login(body: LoginDto, deviceInfo: string | null): Promise<SessionTokensDto> {
    if (!body.identifier || !body.password) {
      throw new AppError(400, "identifier and password are required");
    }

    const user = await this.usersRepository.findByIdentifierWithPassword(body.identifier);
    if (!user || user.status !== "active") {
      throw new AppError(401, "Invalid credentials");
    }

    const matches = await comparePassword(body.password, user.password);
    if (!matches) {
      throw new AppError(401, "Invalid credentials");
    }

    const session = await this.refreshTokensService.issue(user.id, deviceInfo);
    return this.buildTokens(user, session.rawToken, session.expiresAt);
  }

  // ================== REFRESH (OPEN con credencial de sesión) ==================
  public async refresh(
    body: RefreshSessionDto,
    deviceInfo: string | null
  ): Promise<SessionTokensDto> {
    if (!body.refresh_token) {
      throw new AppError(400, "refresh_token is required");
    }

    const outcome = await this.refreshTokensService.rotate(body.refresh_token, deviceInfo);

    if (outcome.kind === "invalid") throw new AppError(401, "Invalid refresh token");
    if (outcome.kind === "expired") throw new AppError(401, "Refresh token expired");
    if (outcome.kind === "reuse") {
      throw new AppError(401, "Refresh token reuse detected: session family revoked");
    }

    const user = await this.usersRepository.findById(outcome.userId);
    if (!user || user.status !== "active") {
      await this.refreshTokensService.revokeAllMine(outcome.userId);
      throw new AppError(401, "User is not active");
    }

    return this.buildTokens(user, outcome.rawToken, outcome.expiresAt);
  }

  // ================== LOGOUT (OPEN con credencial de sesión) ==================
  public async logout(body: LogoutSessionDto): Promise<void> {
    if (!body.refresh_token) {
      throw new AppError(400, "refresh_token is required");
    }
    await this.refreshTokensService.revokeByToken(body.refresh_token);
  }

  // ================== PERFIL (JWT) ==================
  public async profile(userId: number): Promise<ProfileDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user || user.status !== "active") {
      throw new AppError(404, "User not found");
    }
    return toProfile(user);
  }

  public async myPermissions(userId: number): Promise<EffectivePermissionDto[]> {
    return this.resourceRolesService.findEffectiveForUser(userId);
  }

  // ================== HELPERS ==================
  private buildTokens(user: User, refreshToken: string, refreshExpiresAt: Date): SessionTokensDto {
    const access = signAccessToken({ id: user.id, username: user.username });
    return {
      access_token: access.token,
      token_type: "Bearer",
      expires_in: access.expiresIn,
      refresh_token: refreshToken,
      refresh_expires_in: Math.max(
        0,
        Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000)
      ),
    };
  }
}

function toProfile(user: User): ProfileDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar ?? null,
    status: user.status,
  };
}

export { ACCESS_TOKEN_TTL_SECONDS };
EOF
```

---

## 20.3 Controller

```bash
: > src/features/auth/session/session.controller.ts
cat >> src/features/auth/session/session.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { requireAuthUser } from "../../../shared/auth/auth-user";
import { LoginDto, LogoutSessionDto, RefreshSessionDto } from "./dto";
import { SessionService } from "./session.service";

export class SessionController extends BaseController {
  public constructor(
    private readonly service: SessionService = new SessionService()
  ) {
    super();
  }

  // ================== OPEN ==================
  public async login(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const tokens = await this.service.login(req.body as LoginDto, deviceInfo(req));
      res.status(200).json(tokens);
    });
  }

  public async refresh(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const tokens = await this.service.refresh(req.body as RefreshSessionDto, deviceInfo(req));
      res.status(200).json(tokens);
    });
  }

  public async logout(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      await this.service.logout(req.body as LogoutSessionDto);
      res.status(200).json({ message: "Session closed" });
    });
  }

  // ================== JWT ==================
  public async profile(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.profile(requireAuthUser(req).id);
      res.status(200).json({ user });
    });
  }

  public async myPermissions(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const permissions = await this.service.myPermissions(requireAuthUser(req).id);
      res.status(200).json({ permissions });
    });
  }
}

function deviceInfo(req: Request): string | null {
  const value = req.headers["user-agent"];
  if (!value) return null;
  return String(value).slice(0, 500);
}
EOF
```

---

## 20.4 Rutas — las tres modalidades en un solo archivo

| Ruta | Modalidad | Middleware |
|---|---|---|
| `POST /api/sesion/login` | OPEN | — |
| `POST /api/sesion/refresh` | OPEN (credencial de sesión) | — |
| `POST /api/sesion/logout` | OPEN (credencial de sesión) | — |
| `GET /api/sesion/perfil` | JWT | `authenticate` |
| `GET /api/permisos` | JWT | `authenticate` |

```bash
: > src/features/auth/session/session.routes.ts
cat >> src/features/auth/session/session.routes.ts << 'EOF'
import { Application } from "express";
import { SessionController } from "./session.controller";
import { authenticate } from "../access";

export class SessionRoutes {
  public sessionController: SessionController = new SessionController();

  public routes(app: Application): void {
    app
      .route("/api/sesion/login")
      .post(this.sessionController.login.bind(this.sessionController));

    app
      .route("/api/sesion/refresh")
      .post(this.sessionController.refresh.bind(this.sessionController));

    app
      .route("/api/sesion/logout")
      .post(this.sessionController.logout.bind(this.sessionController));

    app
      .route("/api/sesion/perfil")
      .get(authenticate, this.sessionController.profile.bind(this.sessionController));

    app
      .route("/api/permisos")
      .get(authenticate, this.sessionController.myPermissions.bind(this.sessionController));
  }
}
EOF
```

---

## 20.5 Swagger

```bash
: > src/features/auth/session/session.swagger.ts
cat >> src/features/auth/session/session.swagger.ts << 'EOF'
import {
  bearerSecurity,
  openSecurity,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

export const sessionSwagger = {
  tags: [
    { name: "Sesión", description: "Login, renovación, cierre y perfil — **OPEN** + **JWT**" },
  ],
  paths: {
    "/api/sesion/login": {
      post: {
        tags: ["Sesión"],
        summary: "Iniciar sesión (OPEN)",
        description:
          "Modalidad **OPEN**. Valida usuario/correo + contraseña y abre una sesión: " +
          "emite un access token corto (JWT) y un refresh token persistido como hash, con un `family_id` nuevo. " +
          "La respuesta es idéntica para usuario inexistente y contraseña incorrecta.",
        security: openSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Login" } },
          },
        },
        responses: {
          "200": { description: "Par de tokens (`access_token`, `refresh_token`, `expires_in`)" },
          "400": { description: "Faltan `identifier` o `password`" },
          "401": { description: "Credenciales inválidas o usuario inactivo" },
        },
      },
    },
    "/api/sesion/refresh": {
      post: {
        tags: ["Sesión"],
        summary: "Renovar el access token (OPEN con credencial de sesión)",
        description:
          "Modalidad **OPEN**. **Rota** el refresh token. Si se presenta un token ya rotado, " +
          "se interpreta como **reutilización** y se revoca toda la familia (401).",
        security: openSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RefreshToken" } },
          },
        },
        responses: {
          "200": { description: "Par de tokens nuevo" },
          "400": { description: "Falta `refresh_token`" },
          "401": { description: "Token inválido, expirado o reutilizado" },
        },
      },
    },
    "/api/sesion/logout": {
      post: {
        tags: ["Sesión"],
        summary: "Cerrar sesión (OPEN con credencial de sesión)",
        description: "Revoca el refresh token presentado. Idempotente.",
        security: openSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RefreshToken" } },
          },
        },
        responses: {
          "200": { description: "Sesión cerrada (`{ message }`)" },
          "400": { description: "Falta `refresh_token`" },
        },
      },
    },
    "/api/sesion/perfil": {
      get: {
        tags: ["Sesión"],
        summary: "Perfil del usuario autenticado (JWT)",
        description: "El middleware `authenticate` valida el token y **revalida en la base** que el usuario siga activo.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Perfil (`{ user }`) — nunca incluye `password`" },
          "401": unauthorizedResponse,
        },
      },
    },
    "/api/permisos": {
      get: {
        tags: ["Sesión"],
        summary: "Mis permisos efectivos (JWT)",
        description:
          "Ejecuta la misma consulta que el middleware `authorize` y devuelve el par `(method, path)` de cada permiso.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Permisos efectivos (`{ permissions: [...] }`)" },
          "401": unauthorizedResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      Login: {
        type: "object",
        required: ["identifier", "password"],
        properties: {
          identifier: { type: "string", example: "admin", description: "`username` o `email`" },
          password: { type: "string", format: "password", example: "Admin123!" },
        },
      },
      RefreshToken: {
        type: "object",
        required: ["refresh_token"],
        properties: {
          refresh_token: { type: "string", example: "9f2c... (opaco, no es un JWT)" },
        },
      },
      SessionTokens: {
        type: "object",
        properties: {
          access_token: { type: "string" },
          token_type: { type: "string", example: "Bearer" },
          expires_in: { type: "integer", example: 900 },
          refresh_token: { type: "string" },
          refresh_expires_in: { type: "integer", example: 604800 },
        },
      },
    },
  },
};
EOF
```

---

## 20.6 Pruebas HTTP

**`http/session.login.http`**

```bash
: > src/features/auth/session/http/session.login.http
cat >> src/features/auth/session/http/session.login.http << 'EOF'
### Feature Session — LOGIN (modalidad OPEN)
@baseUrl = http://localhost:3000

# @name loginAdmin
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "Admin123!"
}

### Credenciales de ejemplo
# admin  / Admin123!   -> rol ADMIN  (58 permisos)
# seller / Seller123!  -> rol SELLER (7 permisos)

### Login por correo
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "admin@textilclean.local",
  "password": "Admin123!"
}

### Respuesta 401 - credenciales inválidas
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "password-incorrecta"
}

@adminAccessToken = {{loginAdmin.response.body.$.access_token}}
@adminRefreshToken = {{loginAdmin.response.body.$.refresh_token}}
@expiresIn = {{loginAdmin.response.body.$.expires_in}}
EOF
```

**`http/session.refresh.http`**

```bash
: > src/features/auth/session/http/session.refresh.http
cat >> src/features/auth/session/http/session.refresh.http << 'EOF'
### Feature Session — REFRESH (OPEN con credencial de sesión)
@baseUrl = http://localhost:3000

# @name loginAdmin
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "Admin123!"
}

### Refresh: devuelve access_token nuevo + refresh_token ROTADO
# @name refresh
POST {{baseUrl}}/api/sesion/refresh
Content-Type: application/json

{
  "refresh_token": "{{loginAdmin.response.body.$.refresh_token}}"
}

### El access token nuevo sirve en una ruta JWT
GET {{baseUrl}}/api/sesion/perfil
Authorization: Bearer {{refresh.response.body.$.access_token}}

### REUSE: reenviar el token viejo -> 401 y familia revocada
POST {{baseUrl}}/api/sesion/refresh
Content-Type: application/json

{
  "refresh_token": "{{loginAdmin.response.body.$.refresh_token}}"
}

### Consecuencia: el token rotado tampoco sirve ya -> 401
POST {{baseUrl}}/api/sesion/refresh
Content-Type: application/json

{
  "refresh_token": "{{refresh.response.body.$.refresh_token}}"
}
EOF
```

**`http/session.profile.http`**

```bash
: > src/features/auth/session/http/session.profile.http
cat >> src/features/auth/session/http/session.profile.http << 'EOF'
### Feature Session — LOGOUT y PERFIL (OPEN + JWT)
@baseUrl = http://localhost:3000

# @name loginSeller
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "seller",
  "password": "Seller123!"
}

### PERFIL (JWT)
GET {{baseUrl}}/api/sesion/perfil
Authorization: Bearer {{loginSeller.response.body.$.access_token}}

### MIS PERMISOS (JWT)
GET {{baseUrl}}/api/permisos
Authorization: Bearer {{loginSeller.response.body.$.access_token}}

### Sin token -> 401
GET {{baseUrl}}/api/sesion/perfil

### LOGOUT (OPEN + refresh token)
POST {{baseUrl}}/api/sesion/logout
Content-Type: application/json

{
  "refresh_token": "{{loginSeller.response.body.$.refresh_token}}"
}

### Ya no se puede renovar -> 401
POST {{baseUrl}}/api/sesion/refresh
Content-Type: application/json

{
  "refresh_token": "{{loginSeller.response.body.$.refresh_token}}"
}
EOF
```

---

## 20.7 Verificación end-to-end

```bash
npm run db:seed && npm run dev
```

En otra terminal:

```bash
BASE=http://localhost:3000

# 1) OPEN — login
curl -s -X POST $BASE/api/sesion/login -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin123!"}'

# 2) JWT — perfil
ADMIN=$(curl -s -X POST $BASE/api/sesion/login -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin123!"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).access_token")
curl -s -H "Authorization: Bearer $ADMIN" $BASE/api/sesion/perfil

# 3) JWT + RBAC — negocio autorizado
curl -s -H "Authorization: Bearer $ADMIN" $BASE/api/clientes

# 4) JWT + RBAC (denegado)
SELLER=$(curl -s -X POST $BASE/api/sesion/login -H "Content-Type: application/json" \
  -d '{"identifier":"seller","password":"Seller123!"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).access_token")
curl -i -X POST -H "Authorization: Bearer $SELLER" -H "Content-Type: application/json" \
  -d '{"name":"x","phone":"1","email":"x@x.com","password":"x"}' $BASE/api/clientes   # 403

# 5) Renovación — rotar el refresh token
curl -s -X POST $BASE/api/sesion/refresh -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token del login>"}'
```

| Comprobación | Esperado |
|---|---|
| `POST /api/sesion/login` con credenciales válidas | 200 + `access_token` + `refresh_token` |
| `POST /api/sesion/login` con contraseña errónea | **401** genérico |
| `GET /api/sesion/perfil` sin token | **401** |
| `GET /api/permisos` con token de `seller` | lista de 7 recursos |
| `POST /api/clientes` con token de `seller` | **403** |
| `POST /api/sesion/refresh` con refresh válido | 200 + nuevos tokens |
| Reusar el refresh anterior | **401** + familia revocada |

---

## Cableado

**PARCHE — `src/routes/index.ts`**

```typescript
import { SessionRoutes } from "../features/auth/session/session.routes";
// dentro de la clase Routes:
public sessionRoutes: SessionRoutes = new SessionRoutes();
```

**PARCHE — `src/config/index.ts`**

Dentro de `routes()`, después de `refreshTokensRoutes`:

```typescript
    this.routePrv.sessionRoutes.routes(this.app);
```

**PARCHE — `src/swagger/index.ts`**

```typescript
import { sessionSwagger } from "../features/auth/session/session.swagger";
// dentro de featureSwaggerModules:
  sessionSwagger,
```

---

## DoD del ISS-15

- [ ] Todos los criterios de aceptación (20.1 … 20.7) cumplidos
- [ ] Las tres modalidades son observables con `curl` (**401** sin token, **403** sin concesión, **200/201** con ella)
- [ ] `GET /api/permisos` refleja la matriz real (**58** para admin, **7** para seller)
- [ ] La rotación de refresh invalida el token anterior
- [ ] `npx tsc --noEmit` sin errores y `npm run dev` arranca

---

## ✅ GATE de la unidad ISS-15

Con el GATE en verde queda habilitado **CIERRE-AUTH · Cierre Fase II — Auth con RBAC (backend completo)**.

---

**Navegación de la ruta:** ← ISS-15 · 🧠 Aprender · ↑ Ruta Express · → CIERRE-AUTH · 🧠 Aprender