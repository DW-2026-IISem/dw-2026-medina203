# 🛠 ISS-14 · Feature RefreshTokens (sesiones renovables y revocables) — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase II:** Auth con RBAC.
**Feature / tabla:** `features/auth/refresh-tokens/` · `refresh_tokens`
**API:** `/api/sesiones…` — **modalidad JWT**
**Depende de:** ISS-13 — Middlewares de acceso.
**Habilita:** ISS-15 — Feature Session.

**Objetivo:** persistir las sesiones como tokens opacos, de modo que un access token corto pueda renovarse mientras el usuario trabaja, y que una sesión pueda revocarse de verdad.

---

## Criterios de aceptación (ISS-14)

- [ ] 19.1 `refresh-tokens/dto/` (`refresh-token-response.dto.ts`, `index.ts`)
- [ ] 19.2 `refresh-tokens.repository.ts`: busca por `token_hash`, lista por usuario, aplica lock pesimista al rotar y revoca por familia
- [ ] 19.3 `refresh-tokens.service.ts`: `issue`, `rotate` (con reuse detection) y `revoke*`
- [ ] 19.4 `refresh-tokens.controller.ts` y `refresh-tokens.routes.ts` (modalidad **JWT**, sin `authorize`)
- [ ] 19.5 `refresh-tokens.swagger.ts`
- [ ] 19.6 `http/sessions.get.http`
- [ ] `npx tsc --noEmit` OK

```bash
mkdir -p src/features/auth/refresh-tokens/dto
mkdir -p src/features/auth/refresh-tokens/http
```

---

## 19.1 DTOs

**`dto/refresh-token-response.dto.ts`**

```bash
: > src/features/auth/refresh-tokens/dto/refresh-token-response.dto.ts
cat >> src/features/auth/refresh-tokens/dto/refresh-token-response.dto.ts << 'EOF'
import { RefreshToken, RefreshTokenI } from "../refresh-token.model";

/**
 * Respuesta HTTP de una sesión persistida (refresh token).
 *
 * `token_hash` **se omite deliberadamente**: es un artefacto de seguridad. El
 * `id` basta para revocar.
 */
export type RefreshTokenResponseDto = Omit<RefreshTokenI, "token_hash"> & {
  /** Derivado, no columna: `expires_at` ya pasó. */
  is_expired: boolean;
};

/** Mapper modelo -> DTO de respuesta (objeto plano; elimina `token_hash`). */
export function toRefreshTokenResponse(token: RefreshToken): RefreshTokenResponseDto {
  const { token_hash, ...safe } = token.toJSON() as RefreshTokenI & { token_hash?: string };
  return {
    ...safe,
    is_expired: new Date(token.expires_at).getTime() <= Date.now(),
  };
}
EOF
```

**`dto/index.ts`**

```bash
: > src/features/auth/refresh-tokens/dto/index.ts
cat >> src/features/auth/refresh-tokens/dto/index.ts << 'EOF'
export * from "./refresh-token-response.dto";
EOF
```

---

## 19.2 Repository

```bash
: > src/features/auth/refresh-tokens/refresh-tokens.repository.ts
cat >> src/features/auth/refresh-tokens/refresh-tokens.repository.ts << 'EOF'
import { CreationAttributes, Op, Transaction } from "sequelize";
import { RefreshToken } from "./refresh-token.model";

/**
 * Capa Repository del feature RefreshTokens (tabla `refresh_tokens`).
 *
 * Las consultas que participan en la rotación aceptan transacción y, cuando
 * corresponde, bloquean la fila (`FOR UPDATE`) para que dos peticiones de
 * refresh simultáneas no emitan dos tokens válidos.
 */
export class RefreshTokensRepository {
  /** Busca por hash del token. `lock: true` -> `FOR UPDATE` dentro de la transacción. */
  public async findByHash(
    tokenHash: string,
    transaction?: Transaction,
    lock = false
  ): Promise<RefreshToken | null> {
    return RefreshToken.findOne({
      where: { token_hash: tokenHash },
      transaction,
      ...(lock ? { lock: transaction?.LOCK.UPDATE } : {}),
    });
  }

  /** Sesiones de un usuario (activas o todas según `onlyActive`). */
  public async findAllByUser(userId: number, onlyActive = true): Promise<RefreshToken[]> {
    const where: Record<string, unknown> = { user_id: userId };
    if (onlyActive) where.status = "active";

    return RefreshToken.findAll({ where, order: [["createdAt", "DESC"]] });
  }

  /** Una sesión por PK (o `null`). */
  public async findById(id: number): Promise<RefreshToken | null> {
    return RefreshToken.findByPk(id);
  }

  /** Inserta un refresh token (alta de sesión o rotación). */
  public async create(
    data: CreationAttributes<RefreshToken>,
    transaction?: Transaction
  ): Promise<RefreshToken> {
    return RefreshToken.create(data, { transaction });
  }

  /** Persiste cambios sobre una instancia existente. */
  public async update(
    token: RefreshToken,
    data: Partial<RefreshToken>,
    transaction?: Transaction
  ): Promise<RefreshToken> {
    return token.update(data, { transaction });
  }

  /** Revoca **toda la familia** de rotación (reuse detection). */
  public async revokeFamily(familyId: string, transaction?: Transaction): Promise<number> {
    const [updated] = await RefreshToken.update(
      { status: "inactive" },
      { where: { family_id: familyId, status: "active" }, transaction }
    );
    return updated;
  }

  /** Revoca todas las sesiones activas de un usuario (cierre global). */
  public async revokeAllByUser(userId: number): Promise<number> {
    const [updated] = await RefreshToken.update(
      { status: "inactive" },
      { where: { user_id: userId, status: "active" } }
    );
    return updated;
  }

  /** Elimina físicamente las sesiones ya expiradas o revocadas de un usuario. */
  public async purgeInactiveByUser(userId: number): Promise<number> {
    return RefreshToken.destroy({
      where: {
        user_id: userId,
        [Op.or]: [{ status: "inactive" }, { expires_at: { [Op.lt]: new Date() } }],
      },
    });
  }

  /** Cuenta las sesiones activas de un usuario. */
  public async countActiveByUser(userId: number): Promise<number> {
    return RefreshToken.count({ where: { user_id: userId, status: "active" } });
  }
}
EOF
```

---

## 19.3 Service — emitir, rotar, revocar

**Ciclo de vida:**

```
login  → emite family_id = <uuid>  +  refresh token (se guarda sha256)  +  access token (15 min)
uso    → POST /api/sesion/refresh con el refresh token
         ├─ válido y no usado  → ROTA: el viejo pasa a `used`, nace uno nuevo (misma familia)
         └─ ya usado           → REUSE DETECTION: se revoca la familia completa
logout → revoca el refresh token (o toda la familia)
```

```bash
: > src/features/auth/refresh-tokens/refresh-tokens.service.ts
cat >> src/features/auth/refresh-tokens/refresh-tokens.service.ts << 'EOF'
import { Transaction } from "sequelize";
import { randomUUID } from "node:crypto";
import { RefreshTokenResponseDto, toRefreshTokenResponse } from "./dto";
import { RefreshTokensRepository } from "./refresh-tokens.repository";
import { RefreshToken } from "./refresh-token.model";
import { AppError } from "../../../shared/errors/app-error";
import { generateOpaqueToken, sha256Hex } from "../../../shared/auth/password";
import { withTransaction } from "../../../shared/database/with-transaction";

const REFRESH_TTL_DAYS = Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7);

export interface IssuedSession {
  rawToken: string;
  familyId: string;
  expiresAt: Date;
}

export type RotationOutcome =
  | { kind: "rotated"; userId: number; rawToken: string; familyId: string; expiresAt: Date }
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "reuse"; familyId: string; revoked: number };

export class RefreshTokensService {
  public constructor(
    private readonly repository: RefreshTokensRepository = new RefreshTokensRepository()
  ) {}

  // ================== GESTIÓN (sesiones propias) ==================
  public async getAllMine(userId: number): Promise<RefreshTokenResponseDto[]> {
    const tokens = await this.repository.findAllByUser(userId);
    return tokens.map((token) => toRefreshTokenResponse(token));
  }

  public async getMine(userId: number, id: number): Promise<RefreshTokenResponseDto> {
    return toRefreshTokenResponse(await this.findMineOrFail(userId, id));
  }

  public async revokeMine(userId: number, id: number): Promise<RefreshTokenResponseDto> {
    const token = await this.findMineOrFail(userId, id);
    await this.repository.update(token, { status: "inactive" });
    return toRefreshTokenResponse(token);
  }

  public async revokeAllMine(userId: number): Promise<number> {
    return this.repository.revokeAllByUser(userId);
  }

  public async purgeMine(userId: number): Promise<number> {
    return this.repository.purgeInactiveByUser(userId);
  }

  public async countActiveMine(userId: number): Promise<number> {
    return this.repository.countActiveByUser(userId);
  }

  // ================== CICLO DE VIDA ==================
  /** Emite una sesión nueva (alta de login). Genera un `family_id` nuevo. */
  public async issue(
    userId: number,
    deviceInfo: string | null,
    transaction?: Transaction
  ): Promise<IssuedSession> {
    const rawToken = generateOpaqueToken();
    const familyId = randomUUID();
    const expiresAt = expiryFromNow();

    await this.repository.create(
      {
        user_id: userId,
        token_hash: sha256Hex(rawToken),
        family_id: familyId,
        device_info: deviceInfo,
        expires_at: expiresAt,
        status: "active",
      },
      transaction
    );

    return { rawToken, familyId, expiresAt };
  }

  /**
   * Rota un refresh token: lo invalida y emite uno nuevo con el mismo
   * `family_id`. Todo dentro de una transacción con bloqueo de fila.
   */
  public async rotate(rawToken: string, deviceInfo: string | null): Promise<RotationOutcome> {
    const hash = sha256Hex(rawToken);

    const outcome = await withTransaction<RotationOutcome>(async (t) => {
      const current = await this.repository.findByHash(hash, t, true);

      if (!current) return { kind: "invalid" };

      // REUSE DETECTION: existía pero ya no está activo (fue rotado).
      if (current.status !== "active") {
        const revoked = await this.repository.revokeFamily(current.family_id, t);
        return { kind: "reuse", familyId: current.family_id, revoked };
      }

      if (new Date(current.expires_at).getTime() <= Date.now()) {
        await this.repository.update(current, { status: "inactive" }, t);
        return { kind: "expired" };
      }

      // Rotación: el usado se invalida y nace uno nuevo en la misma familia.
      await this.repository.update(current, { status: "inactive" }, t);

      const rawNext = generateOpaqueToken();
      const expiresAt = expiryFromNow();
      await this.repository.create(
        {
          user_id: current.user_id,
          token_hash: sha256Hex(rawNext),
          family_id: current.family_id,
          device_info: deviceInfo ?? current.device_info,
          expires_at: expiresAt,
          status: "active",
        },
        t
      );

      return {
        kind: "rotated",
        userId: current.user_id,
        rawToken: rawNext,
        familyId: current.family_id,
        expiresAt,
      };
    });

    return outcome;
  }

  /** Cierra la sesión asociada a un refresh token (logout). Idempotente. */
  public async revokeByToken(rawToken: string): Promise<boolean> {
    const token = await this.repository.findByHash(sha256Hex(rawToken));
    if (!token) return false;
    if (token.status !== "active") return true;

    await this.repository.update(token, { status: "inactive" });
    return true;
  }

  // ================== HELPERS ==================
  /**
   * Busca una sesión **del propio usuario**. El filtro por `user_id` es la
   * frontera de seguridad: un usuario nunca puede ver ni revocar la sesión de
   * otro. Un `id` ajeno responde 404, no 403.
   */
  private async findMineOrFail(userId: number, id: number): Promise<RefreshToken> {
    const token = await this.repository.findById(id);
    if (!token || token.user_id !== userId) {
      throw new AppError(404, "Session not found");
    }
    return token;
  }
}

function expiryFromNow(): Date {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}
EOF
```

---

## 19.4 Controller y rutas

> **Nota de diseño:** estas rutas son modalidad **JWT sin `authorize`**. Ver y
> revocar las **propias** sesiones es un derecho derivado de estar autenticado,
> no una concesión de la matriz. Por eso **no figuran en el catálogo de 58
> recursos**.

**`refresh-tokens.controller.ts`**

```bash
: > src/features/auth/refresh-tokens/refresh-tokens.controller.ts
cat >> src/features/auth/refresh-tokens/refresh-tokens.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { requireAuthUser } from "../../../shared/auth/auth-user";
import { RefreshTokensService } from "./refresh-tokens.service";

export class RefreshTokensController extends BaseController {
  public constructor(
    private readonly service: RefreshTokensService = new RefreshTokensService()
  ) {
    super();
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const sessions = await this.service.getAllMine(requireAuthUser(req).id);
      res.status(200).json({ sessions });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const session = await this.service.getMine(requireAuthUser(req).id, this.paramId(req));
      res.status(200).json({ session });
    });
  }

  public async revokeAll(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const revoked = await this.service.revokeAllMine(requireAuthUser(req).id);
      res.status(200).json({ message: "All sessions revoked", revoked });
    });
  }

  public async revokeOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const session = await this.service.revokeMine(
        requireAuthUser(req).id,
        this.paramId(req)
      );
      res.status(200).json({ message: "Session revoked", session });
    });
  }

  public async purge(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const purged = await this.service.purgeMine(requireAuthUser(req).id);
      res.status(200).json({ message: "Inactive sessions purged", purged });
    });
  }
}
EOF
```

**`refresh-tokens.routes.ts`**

```bash
: > src/features/auth/refresh-tokens/refresh-tokens.routes.ts
cat >> src/features/auth/refresh-tokens/refresh-tokens.routes.ts << 'EOF'
import { Application } from "express";
import { RefreshTokensController } from "./refresh-tokens.controller";
import { authenticate } from "../access";

/**
 * Rutas del feature RefreshTokens — **modalidad 2 (JWT, sin RBAC)**.
 *
 * Nota de enrutado: `/api/sesiones/deactivate-all` es una **ruta literal** del
 * mismo verbo (`PATCH`) que `/api/sesiones/:id/deactivate`. No colisionan (distinto
 * número de segmentos), pero la literal se registra primero por claridad.
 */
export class RefreshTokensRoutes {
  public refreshTokensController: RefreshTokensController = new RefreshTokensController();

  public routes(app: Application): void {
    app
      .route("/api/sesiones")
      .get(authenticate, this.refreshTokensController.getAll.bind(this.refreshTokensController))
      .delete(authenticate, this.refreshTokensController.purge.bind(this.refreshTokensController));

    // Literal ANTES que /:id (regla de Express por orden de registro).
    app
      .route("/api/sesiones/deactivate-all")
      .patch(authenticate, this.refreshTokensController.revokeAll.bind(this.refreshTokensController));

    app
      .route("/api/sesiones/:id")
      .get(authenticate, this.refreshTokensController.getOne.bind(this.refreshTokensController));

    app
      .route("/api/sesiones/:id/deactivate")
      .patch(authenticate, this.refreshTokensController.revokeOne.bind(this.refreshTokensController));
  }
}
EOF
```

---

## 19.5 Swagger

```bash
: > src/features/auth/refresh-tokens/refresh-tokens.swagger.ts
cat >> src/features/auth/refresh-tokens/refresh-tokens.swagger.ts << 'EOF'
import {
  bearerSecurity,
  invalidIdResponse,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

export const refreshTokensSwagger = {
  tags: [
    {
      name: "Sesiones",
      description:
        "Sesiones persistidas del usuario autenticado (refresh tokens): listar, consultar y revocar — **JWT**",
    },
  ],
  paths: {
    "/api/sesiones": {
      get: {
        tags: ["Sesiones"],
        summary: "Listar mis sesiones activas",
        description: "Devuelve las sesiones del usuario del token. `token_hash` nunca se expone.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Sesiones propias (`{ sessions: [...] }`)" },
          "401": unauthorizedResponse,
        },
      },
      delete: {
        tags: ["Sesiones"],
        summary: "Purgar mis sesiones revocadas/expiradas",
        description: "Borrado físico de las sesiones propias ya inútiles.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Purga realizada (`{ message, purged }`)" },
          "401": unauthorizedResponse,
        },
      },
    },
    "/api/sesiones/deactivate-all": {
      patch: {
        tags: ["Sesiones"],
        summary: "Revocar todas mis sesiones",
        description:
          "Pone `inactive` todas las sesiones propias (todos los dispositivos). " +
          "Útil ante sospecha de robo: el refresh token deja de servir de inmediato.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Sesiones revocadas (`{ message, revoked }`)" },
          "401": unauthorizedResponse,
        },
      },
    },
    "/api/sesiones/{id}": {
      get: {
        tags: ["Sesiones"],
        summary: "Consultar una sesión propia",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Sesión (`{ session }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "404": { description: "No encontrada o no pertenece al usuario autenticado" },
        },
      },
    },
    "/api/sesiones/{id}/deactivate": {
      patch: {
        tags: ["Sesiones"],
        summary: "Revocar una sesión propia",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Sesión revocada (`{ message, session }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "404": { description: "No encontrada o no pertenece al usuario autenticado" },
        },
      },
    },
  },
  components: {
    schemas: {
      Session: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          user_id: { type: "integer", example: 2 },
          family_id: { type: "string", format: "uuid" },
          device_info: { type: "string", nullable: true, example: "Mozilla/5.0 ..." },
          expires_at: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          is_expired: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
EOF
```

---

## 19.6 Pruebas HTTP

```bash
: > src/features/auth/refresh-tokens/http/sessions.get.http
cat >> src/features/auth/refresh-tokens/http/sessions.get.http << 'EOF'
### Feature RefreshTokens — SESIONES PROPIAS (modalidad JWT, sin RBAC)
@baseUrl = http://localhost:3000

# @name loginSeller
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "seller",
  "password": "Seller123!"
}

@token = {{loginSeller.response.body.$.access_token}}

### Listar mis sesiones activas
GET {{baseUrl}}/api/sesiones
Authorization: Bearer {{token}}

### Consultar una sesión propia
GET {{baseUrl}}/api/sesiones/1
Authorization: Bearer {{token}}

### Revocar TODAS mis sesiones
PATCH {{baseUrl}}/api/sesiones/deactivate-all
Authorization: Bearer {{token}}

### Revocar una sesión concreta
PATCH {{baseUrl}}/api/sesiones/1/deactivate
Authorization: Bearer {{token}}

### Purgar mis sesiones revocadas/expiradas
DELETE {{baseUrl}}/api/sesiones
Authorization: Bearer {{token}}

### Modalidad JWT: sin token -> 401
GET {{baseUrl}}/api/sesiones
EOF
```

> **⚠️ Nota:** `POST /api/sesion/login` **aún no existe**. Llega en **ISS-15**. Sin él, no puedes obtener un token para probar. El código del ISS-14 **sí compila** y **sí queda registrado**. La prueba funcional completa llega en ISS-15.

---

## Cableado

**PARCHE — `src/routes/index.ts`**

```typescript
import { RefreshTokensRoutes } from "../features/auth/refresh-tokens/refresh-tokens.routes";
// dentro de la clase Routes:
public refreshTokensRoutes: RefreshTokensRoutes = new RefreshTokensRoutes();
```

**PARCHE — `src/config/index.ts`**

Dentro de `routes()`, después de las 5 de business y las 5 de Auth:

```typescript
    this.routePrv.refreshTokensRoutes.routes(this.app);
```

**PARCHE — `src/swagger/index.ts`**

```typescript
import { refreshTokensSwagger } from "../features/auth/refresh-tokens/refresh-tokens.swagger";
// dentro de featureSwaggerModules:
  refreshTokensSwagger,
```

---

## Verificación

```bash
npx tsc --noEmit
npm run dev
```

Y consulta en la BD (con DBeaver o CLI):

```sql
-- Tras un login hay una fila `active`; tras un refresh, la vieja queda `used`.
SELECT id, user_id, family_id, status, expires_at FROM refresh_tokens ORDER BY id;
```

---

## DoD del ISS-14

- [ ] Todos los criterios de aceptación (19.1 … 19.6) cumplidos
- [ ] En BD **nunca** hay un refresh token en claro: solo `token_hash`
- [ ] Rotar dos veces el mismo token dispara la revocación de la familia
- [ ] `PATCH /api/sesiones/:id/deactivate` solo afecta a una sesión propia
- [ ] `npx tsc --noEmit` sin errores y `npm run dev` arranca

---

## ✅ GATE de la unidad ISS-14

Con el GATE en verde queda habilitado **ISS-15 · Feature Session (login y perfil)**.

---

**Navegación de la ruta:** ← ISS-14 · 🧠 Aprender · ↑ Ruta Express · → ISS-15 · 🧠 Aprender