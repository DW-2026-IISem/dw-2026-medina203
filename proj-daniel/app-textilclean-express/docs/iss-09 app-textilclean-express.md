# 🛠 ISS-09 · Auth base (seguridad y modelos) — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase II:** Auth con RBAC (extiende Fase I ya construida).
**Feature / tablas:** `src/shared/auth/`, `src/shared/http/` y los 6 modelos de `features/auth/`.
**API:** — (infraestructura: aún no expone endpoints)
**Depende de:** Cierre de Fase I — Estructura final y DoD.
**Habilita:** ISS-10 — Feature Users.

**Objetivo:** dejar listas las primitivas de seguridad (hash de contraseña, hashes de tokens opacos, firma y verificación de JWT, matcher de rutas) y las seis tablas del modelo RBAC con sus asociaciones, de modo que los ISS posteriores solo construyan capas sobre esta base.

**Bloqueado por:** Fase I cerrada (el App, Routes, SeedersRunner y Swagger ya existen y se extienden, no se reescriben).

---

## Principios que fija este ISS

1. **No existe la entidad `Permission`.** La autorización se modela como un grafo:

```
User
 │  N:M  (RoleUser)
 ↓
Role
 │  N:M  (ResourceRole)
 ↓
Resource
```

**`Role + Resource = permiso concedido`.**

2. **Tres modalidades de acceso** (se deciden por ruta):

| Modalidad | Qué exige | Middleware | Ejemplos |
|---|---|---|---|
| OPEN | nada | — | `POST /api/sesion/login`, `/refresh`, `/logout`, `/api/docs` |
| JWT | access token válido | `authenticate` | `GET /api/sesion/perfil`, `/api/permisos`, `/api/sesiones/*` |
| JWT + RBAC | token válido y concesión activa | `authenticate` + `authorize` | CRUD de negocio y administración |

3. `status` es `'active' | 'inactive'` en las seis tablas. Un registro `inactive` es invisible para la API y no autoriza.

4. **Deny by default:** sin concesión explícita, la respuesta es 403.

---

## Criterios de aceptación (ISS-09)

- [ ] 14.1 `.env` define `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_DAYS`; `jsonwebtoken` + `@types/jsonwebtoken` instalados
- [ ] 14.2 `src/shared/auth/password.ts` con `hashPassword`, `comparePassword`, `sha256Hex`, `generateOpaqueToken`
- [ ] 14.3 `src/shared/auth/jwt.ts` firma/verifica con HS256, issuer, audience, expiresIn, jti
- [ ] 14.4 `src/shared/auth/resource-match.ts` casa `/api/productos/42` con `/api/productos/:id`
- [ ] 14.5 `src/shared/auth/auth-user.ts` declara `Request.auth` y exporta `requireAuthUser`
- [ ] 14.6 `sendError` centraliza error → HTTP; `BaseController` lo reutiliza
- [ ] 14.7 `bearerSecurityScheme`, `unauthorizedResponse` y `forbiddenResponse` exportados
- [ ] 14.8 Los 6 modelos (`User`, `Role`, `Resource`, `RoleUser`, `ResourceRole`, `RefreshToken`) con sus UK e índices
- [ ] 14.9 `rbac.associations.ts` declara el grafo completo
- [ ] 14.10 `config/index.ts` y `seeders/index.ts` importan los modelos y las asociaciones, en ese orden
- [ ] `npx tsc --noEmit` OK

---

## 14.1 Dependencias y variables de entorno

```bash
npm install jsonwebtoken@^9.0.3
npm install -D @types/jsonwebtoken@^9.0.10
```

**PARCHE — `.env`** (añadir al final, no reemplaza lo existente):

```bash
cat >> .env << 'EOF'

# ─────────────────────────────────────────────────────────────
# Fase II — Seguridad (JWT + RBAC)
# ─────────────────────────────────────────────────────────────
# Secreto de firma del access token (HMAC SHA-256). Mínimo 32 caracteres.
# En producción: generar con `openssl rand -base64 48` y NO versionarlo.
JWT_SECRET=storelab-lab-secret-change-me-0123456789abcdef
# Vida útil del access token en segundos (900 = 15 min).
JWT_ACCESS_TTL=900
# Vida útil del refresh token en días.
JWT_REFRESH_TTL_DAYS=7
EOF
```

> `JWT_ACCESS_TTL` en segundos; `JWT_REFRESH_TTL_DAYS` en días. Son unidades distintas a propósito.

---

## 14.2 `src/shared/auth/password.ts`

```bash
: > src/shared/auth/password.ts
cat >> src/shared/auth/password.ts << 'EOF'
import { hash, compare } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

/**
 * Derivación y verificación de contraseñas (bcrypt) y utilidades de tokens.
 *
 * Se centraliza aquí porque lo usan tres sitios distintos y **debe** usar los
 * mismos parámetros en los tres:
 *  - el hook `beforeCreate/beforeUpdate` del modelo `User` (hash al persistir);
 *  - el service de usuarios al cambiar la contraseña;
 *  - el login, que compara la credencial en memoria (nunca la devuelve).
 *
 * Coste 12 rondas: compromiso entre coste de CPU del servidor y coste de fuerza
 * bruta para un atacante que obtuviera el hash.
 */
const SALT_ROUNDS = 12;

/** Devuelve el hash bcrypt de una contraseña en claro. */
export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, SALT_ROUNDS);
}

/** `true` si la contraseña en claro corresponde al hash almacenado. */
export async function comparePassword(plain: string, passwordHash: string): Promise<boolean> {
  return compare(plain, passwordHash);
}

/**
 * Hash determinista (SHA-256, hex) para credenciales de **alta entropía**.
 * Se usa con los refresh tokens, no con contraseñas.
 */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Genera un token opaco no adivinable (URL-safe, 64 bytes ≈ 86 caracteres). */
export function generateOpaqueToken(): string {
  return randomBytes(64).toString("base64url");
}
EOF
```

---

## 14.3 `src/shared/auth/jwt.ts`

```bash
: > src/shared/auth/jwt.ts
cat >> src/shared/auth/jwt.ts << 'EOF'
import jwt, { JwtPayload } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { AppError } from "../errors/app-error";

/**
 * Emisión y verificación del **access token** (JWT firmado, HS256).
 */

const ALGORITHM = "HS256";

export const TOKEN_ISSUER = "app-textilclean-express";
export const TOKEN_AUDIENCE = "app-textilclean-api";

export const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.JWT_ACCESS_TTL ?? 900);

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  username: string;
  jti: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new AppError(
      500,
      "JWT_SECRET no configurado (mínimo 32 caracteres). Ver .env"
    );
  }
  return secret;
}

/** Firma un access token para un usuario. */
export function signAccessToken(user: { id: number; username: string }): {
  token: string;
  expiresIn: number;
} {
  const token = jwt.sign(
    { username: user.username },
    getSecret(),
    {
      algorithm: ALGORITHM,
      subject: String(user.id),
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      jwtid: randomUUID(),
    }
  );
  return { token, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, getSecret(), {
      algorithms: [ALGORITHM],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      clockTolerance: 5,
    }) as JwtPayload;
  } catch {
    throw new AppError(401, "Invalid or expired access token");
  }

  if (
    typeof payload.sub !== "string" ||
    !/^[1-9]\d*$/.test(payload.sub) ||
    typeof payload.jti !== "string" ||
    payload.jti.length === 0
  ) {
    throw new AppError(401, "Invalid or expired access token");
  }

  return payload as AccessTokenPayload;
}

/** Extrae el token de `Authorization: Bearer <token>`. */
export function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (!scheme || !value || scheme.toLowerCase() !== "bearer") return null;
  return value;
}
EOF
```

---

## 14.4 `src/shared/auth/resource-match.ts`

```bash
: > src/shared/auth/resource-match.ts
cat >> src/shared/auth/resource-match.ts << 'EOF'
/**
 * Coincidencia entre la ruta de una petición y un **recurso** almacenado.
 */

export function normalizePath(path: string): string {
  const withoutQuery = path.split("?")[0].split("#")[0];
  const single = withoutQuery.replace(/\/{2,}/g, "/");
  const trimmed = single.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** `true` si `path` (concreto) casa con `pattern` (con `:param`). */
export function pathMatches(pattern: string, path: string): boolean {
  const patternParts = normalizePath(pattern).split("/");
  const pathParts = normalizePath(path).split("/");

  if (patternParts.length !== pathParts.length) return false;

  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    if (p.startsWith(":")) continue;
    if (p !== pathParts[i]) return false;
  }
  return true;
}

export function isOperationGranted(
  granted: ReadonlyArray<{ method: string; path: string }>,
  method: string,
  path: string
): boolean {
  const upper = method.toUpperCase();
  return granted.some(
    (resource) => resource.method.toUpperCase() === upper && pathMatches(resource.path, path)
  );
}
EOF
```

---

## 14.5 `src/shared/auth/auth-user.ts`

```bash
: > src/shared/auth/auth-user.ts
cat >> src/shared/auth/auth-user.ts << 'EOF'
import { Request } from "express";
import { AppError } from "../errors/app-error";

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  tokenId?: string;
}

export function requireAuthUser(req: Request): AuthUser {
  if (!req.auth) {
    throw new AppError(401, "Authentication required");
  }
  return req.auth;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export {};
EOF
```

---

## 14.6 `src/shared/http/error-response.ts` + PARCHE `BaseController`

```bash
: > src/shared/http/error-response.ts
cat >> src/shared/http/error-response.ts << 'EOF'
import { Response } from "express";
import { AppError } from "../errors/app-error";

/**
 * Traduce cualquier error a una respuesta HTTP. **Único punto** del proyecto.
 */
export function sendError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: "Internal server error", detail: String(error) });
}
EOF
```

**PARCHE — `src/shared/http/base-controller.ts`**: reemplazar todo el archivo por esta versión que delega en `sendError`.

```bash
: > src/shared/http/base-controller.ts
cat >> src/shared/http/base-controller.ts << 'EOF'
import { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { sendError } from "./error-response";

export abstract class BaseController {
  protected async run(res: Response, work: () => Promise<void>): Promise<void> {
    try {
      await work();
    } catch (error) {
      this.handleError(res, error);
    }
  }

  protected paramId(req: Request): number {
    const raw = req.params.id;
    const value = Array.isArray(raw) ? raw[0] : raw;

    if (!value || !/^\d+$/.test(value) || Number(value) < 1) {
      throw new AppError(400, "Invalid id: must be a positive integer");
    }
    return Number(value);
  }

  protected handleError(res: Response, error: unknown): void {
    sendError(res, error);
  }
}
EOF
```

---

## 14.7 `src/shared/http/swagger-security.ts`

```bash
: > src/shared/http/swagger-security.ts
cat >> src/shared/http/swagger-security.ts << 'EOF'
/** Esquema de seguridad (RFC 6750: `Authorization: Bearer <token>`). */
export const bearerSecurityScheme = {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "Access token JWT obtenido en `POST /api/sesion/login`. Enviar como " +
      "`Authorization: Bearer <access_token>`. Vida útil corta; se renueva con " +
      "`POST /api/sesion/refresh`.",
  },
};

export const openSecurity: unknown[] = [];
export const bearerSecurity = [{ bearerAuth: [] }];

export const unauthorizedResponse = {
  description:
    "401 No autenticado — falta el Bearer token, el token es inválido/expiró o el usuario está inactivo",
};

export const forbiddenResponse = {
  description:
    "403 Prohibido — autenticado, pero sin concesión activa para esta operación (deny by default)",
};

export const invalidIdResponse = {
  description: "400 id inválido (debe ser un entero positivo)",
};

export const notFoundResponse = {
  description: "404 No encontrado",
};
EOF
```

---

## 14.8 Los seis modelos Sequelize

### `User`

```bash
mkdir -p src/features/auth/users
: > src/features/auth/users/user.model.ts
cat >> src/features/auth/users/user.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";
import { hashPassword } from "../../../shared/auth/password";

export interface UserI {
  id?: number;
  username: string;
  email: string;
  password: string;
  avatar?: string | null;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public avatar!: string | null;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    username: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: "uq_users_username",
      validate: {
        notEmpty: { msg: "Username cannot be empty" },
        len: { args: [3, 80], msg: "Username must be between 3 and 80 characters" },
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: "uq_users_email",
      validate: {
        isEmail: { msg: "Email must be a valid email address" },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: "Password cannot be empty" } },
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) user.password = await hashPassword(user.password);
      },
      beforeUpdate: async (user: User) => {
        if (user.changed("password") && user.password) {
          user.password = await hashPassword(user.password);
        }
      },
      beforeBulkCreate: async (users: User[]) => {
        for (const user of users) {
          if (user.password) user.password = await hashPassword(user.password);
        }
      },
      beforeValidate: (user: User) => {
        if (user.username) user.username = user.username.trim().toLowerCase();
        if (user.email) user.email = user.email.trim().toLowerCase();
      },
    },
  }
);
EOF
```

### `Role`

```bash
mkdir -p src/features/auth/roles
: > src/features/auth/roles/role.model.ts
cat >> src/features/auth/roles/role.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface RoleI {
  id?: number;
  name: string;
  description?: string | null;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class Role extends Model {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Role.init(
  {
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: "uq_roles_name",
      validate: { notEmpty: { msg: "Role name cannot be empty" } },
    },
    description: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Role",
    tableName: "roles",
    timestamps: true,
    hooks: {
      beforeValidate: (role: Role) => {
        if (role.name) role.name = role.name.trim().toUpperCase();
      },
    },
  }
);
EOF
```

### `Resource`

```bash
mkdir -p src/features/auth/resources
: > src/features/auth/resources/resource.model.ts
cat >> src/features/auth/resources/resource.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";
import { normalizePath } from "../../../shared/auth/resource-match";

export interface ResourceI {
  id?: number;
  method: string;
  path: string;
  description?: string | null;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class Resource extends Model {
  public id!: number;
  public method!: string;
  public path!: string;
  public description!: string | null;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Resource.init(
  {
    method: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: {
          args: [["GET", "POST", "PUT", "PATCH", "DELETE"]],
          msg: "Method must be one of GET, POST, PUT, PATCH, DELETE",
        },
      },
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: "Path cannot be empty" } },
    },
    description: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Resource",
    tableName: "resources",
    timestamps: true,
    indexes: [
      { name: "uq_resources_method_path", unique: true, fields: ["method", "path"] },
    ],
    hooks: {
      beforeValidate: (resource: Resource) => {
        if (resource.method) resource.method = resource.method.trim().toUpperCase();
        if (resource.path) resource.path = normalizePath(resource.path.trim());
      },
    },
  }
);
EOF
```

### `RoleUser`

```bash
mkdir -p src/features/auth/role-users
: > src/features/auth/role-users/role-user.model.ts
cat >> src/features/auth/role-users/role-user.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface RoleUserI {
  id?: number;
  user_id: number;
  role_id: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class RoleUser extends Model {
  public id!: number;
  public user_id!: number;
  public role_id!: number;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RoleUser.init(
  {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "RoleUser",
    tableName: "role_users",
    timestamps: true,
    indexes: [
      { name: "uq_role_users_user_role", unique: true, fields: ["user_id", "role_id"] },
      { name: "ix_role_users_user_id", fields: ["user_id"] },
      { name: "ix_role_users_role_id", fields: ["role_id"] },
    ],
  }
);
EOF
```

### `ResourceRole`

```bash
mkdir -p src/features/auth/resource-roles
: > src/features/auth/resource-roles/resource-role.model.ts
cat >> src/features/auth/resource-roles/resource-role.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface ResourceRoleI {
  id?: number;
  role_id: number;
  resource_id: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class ResourceRole extends Model {
  public id!: number;
  public role_id!: number;
  public resource_id!: number;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ResourceRole.init(
  {
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    resource_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ResourceRole",
    tableName: "resource_roles",
    timestamps: true,
    indexes: [
      {
        name: "uq_resource_roles_role_resource",
        unique: true,
        fields: ["role_id", "resource_id"],
      },
      { name: "ix_resource_roles_role_id", fields: ["role_id"] },
      { name: "ix_resource_roles_resource_id", fields: ["resource_id"] },
    ],
  }
);
EOF
```

### `RefreshToken`

```bash
mkdir -p src/features/auth/refresh-tokens
: > src/features/auth/refresh-tokens/refresh-token.model.ts
cat >> src/features/auth/refresh-tokens/refresh-token.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface RefreshTokenI {
  id?: number;
  user_id: number;
  token_hash: string;
  family_id: string;
  device_info?: string | null;
  expires_at: Date;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class RefreshToken extends Model {
  public id!: number;
  public user_id!: number;
  public token_hash!: string;
  public family_id!: string;
  public device_info!: string | null;
  public expires_at!: Date;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RefreshToken.init(
  {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "uq_refresh_tokens_token_hash",
    },
    family_id: { type: DataTypes.STRING(100), allowNull: false },
    device_info: { type: DataTypes.STRING(500), allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      // Única tabla cuyo estado por defecto es `active`.
      defaultValue: "active",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "RefreshToken",
    tableName: "refresh_tokens",
    timestamps: true,
    indexes: [
      { name: "ix_refresh_tokens_family_id", fields: ["family_id"] },
      { name: "ix_refresh_tokens_user_id", fields: ["user_id"] },
    ],
  }
);
EOF
```

---

## 14.9 `src/features/auth/rbac.associations.ts`

```bash
: > src/features/auth/rbac.associations.ts
cat >> src/features/auth/rbac.associations.ts << 'EOF'
import { User } from "./users/user.model";
import { Role } from "./roles/role.model";
import { Resource } from "./resources/resource.model";
import { RoleUser } from "./role-users/role-user.model";
import { ResourceRole } from "./resource-roles/resource-role.model";
import { RefreshToken } from "./refresh-tokens/refresh-token.model";

// --- La concesión conoce su rol y su recurso ---
ResourceRole.belongsTo(Role, { foreignKey: "role_id", as: "role" });
ResourceRole.belongsTo(Resource, { foreignKey: "resource_id", as: "resource" });
Role.hasMany(ResourceRole, { foreignKey: "role_id", as: "resource_roles" });
Resource.hasMany(ResourceRole, { foreignKey: "resource_id", as: "resource_roles" });

// --- La asignación conoce su usuario y su rol ---
RoleUser.belongsTo(User, { foreignKey: "user_id", as: "user" });
RoleUser.belongsTo(Role, { foreignKey: "role_id", as: "role" });
User.hasMany(RoleUser, { foreignKey: "user_id", as: "role_users" });
Role.hasMany(RoleUser, { foreignKey: "role_id", as: "role_users" });

// --- Las sesiones pertenecen a un usuario ---
RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(RefreshToken, { foreignKey: "user_id", as: "refresh_tokens" });
EOF
```

---

## 14.10 Cableado de modelos en config y seeders

**PARCHE — `src/config/index.ts`**

Abre el archivo con VS Code:

```bash
code src/config/index.ts
```

Debajo de los imports de business (después de `product-sales.associations`), añadir:

```typescript
// Fase II — Auth con RBAC: primero los seis modelos, después las asociaciones
import "../features/auth/users/user.model";
import "../features/auth/roles/role.model";
import "../features/auth/resources/resource.model";
import "../features/auth/role-users/role-user.model";
import "../features/auth/resource-roles/resource-role.model";
import "../features/auth/refresh-tokens/refresh-token.model";
import "../features/auth/rbac.associations";
```

**IMPORTANTE — no añadas todavía las llamadas a `sessionRoutes`, `usersRoutes`, etc.** en `routes()`, porque esos módulos aún no existen (llegan en ISS-10 a ISS-13). Si las añades ahora, el servidor fallará al arrancar.

Tu método `routes()` debe seguir así por ahora:

```typescript
private routes(): void {
    this.routePrv.clientsRoutes.routes(this.app);
    this.routePrv.productTypesRoutes.routes(this.app);
    this.routePrv.productsRoutes.routes(this.app);
    this.routePrv.salesRoutes.routes(this.app);
    this.routePrv.productSalesRoutes.routes(this.app);
    // Las rutas de Auth se añaden en ISS-10…13
}
```

**PARCHE — `src/database/seeders/index.ts`**

Debajo de los imports de business, añadir los 6 modelos + `rbac.associations`:

```typescript
import "../../features/auth/users/user.model";
import "../../features/auth/roles/role.model";
import "../../features/auth/resources/resource.model";
import "../../features/auth/role-users/role-user.model";
import "../../features/auth/resource-roles/resource-role.model";
import "../../features/auth/refresh-tokens/refresh-token.model";
import "../../features/auth/rbac.associations";
```

No añadas seeders de Auth todavía (llegan en ISS-10).

---

## Verificación

```bash
npx tsc --noEmit
```

Esperado: **0 errores**.

```bash
npm run db:seed
```

Esperado: **sincroniza las 6 tablas nuevas** (`users`, `roles`, `resources`, `role_users`, `resource_roles`, `refresh_tokens`) además de las de Fase I. Los seeders de auth todavía no existen, así que no insertan datos.

```bash
npm run dev
```

Esperado: servidor arranca sin errores.

Verifica que las tablas existen (DBeaver o `mysql` CLI):

```sql
SHOW TABLES LIKE 'users';
SHOW TABLES LIKE 'roles';
SHOW TABLES LIKE 'resources';
SHOW TABLES LIKE 'role_users';
SHOW TABLES LIKE 'resource_roles';
SHOW TABLES LIKE 'refresh_tokens';
```

Las 6 deben existir.

---

## DoD del ISS-09

- [ ] Todos los criterios de aceptación (14.1 … 14.10) cumplidos
- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run db:seed` crea las 6 tablas con sus índices y UK
- [ ] `npm run dev` arranca el servidor
- [ ] **Sin endpoints nuevos todavía**: la API de Fase I sigue funcionando **SIN AUTH** (la protección llega en ISS-13)

---

## ✅ GATE de la unidad ISS-09

Las condiciones de cierre son exactamente las que define el ISS técnico de esta misma página:

- 📋 Criterios de aceptación → **Criterios de aceptación**
- 🧩 Cierre de la unidad → **DoD del ISS-09**
- 🧠 Autoevaluación → Evaluación del cuaderno

Con el GATE en verde queda habilitado **ISS-10 · Feature Users**.

---

**Navegación de la ruta:** ← ISS-09 · 🧠 Aprender · ↑ Ruta Express · → ISS-10 · 🧠 Aprender