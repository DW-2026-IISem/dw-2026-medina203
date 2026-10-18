# 🛠 ISS-10 · Feature Users (identidad y contraseña) — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase II:** Auth con RBAC (extiende Fase I ya construida).
**Feature / tabla:** `features/auth/users/` · `users`
**API:** `/api/usuarios…` — **JWT + RBAC**
**Depende de:** ISS-09 — Base de seguridad y modelos Auth.
**Habilita:** ISS-11 — Features Roles y Resources.

**Objetivo:** construir el CRUD de identidades como un feature más (mismas 4 capas y mismo contrato DTO que los de Fase I), con dos diferencias clave:
1. La contraseña **nunca** entra ni sale en claro.
2. El service expone una consulta de **permisos efectivos** que recorre el grafo RBAC.

---

## Criterios de aceptación (ISS-10)

- [ ] 15.1 Carpeta `dto/` con `create-user.dto.ts`, `update-user.dto.ts`, `patch-user.dto.ts`, `change-password.dto.ts`, `user-response.dto.ts` e `index.ts`
- [ ] 15.2 `users.repository.ts` accede a Sequelize con `User`; incluye `findByIdentifierWithPassword`
- [ ] 15.3 `users.service.ts`: hashea al crear/actualizar, valida unicidad (409) y ofrece `getEffectivePermissions`
- [ ] 15.4 `users.controller.ts`: usa `this.run(res, …)` y `this.paramId(req)`; nunca devuelve el hash
- [ ] 15.5 `users.routes.ts` protege todas las operaciones con `authenticate` + `authorize`
- [ ] 15.6 `users.seeder.ts` crea `admin` y `seller` de forma idempotente
- [ ] 15.7 `users.swagger.ts` documenta los 9 endpoints con `security: bearerAuth`
- [ ] 15.8 Archivos `.http` de lectura y escritura
- [ ] `npx tsc --noEmit` OK

> **⚠️ Aviso importante:** este ISS introduce `authenticate` y `authorize` (middlewares de acceso) que **aún no existen** — se crean en **ISS-13**. Por eso, al correr `npm run dev` en este punto, `/api/usuarios` responderá **401** (no hay token y los middlewares aún no están montados correctamente). Es lo esperado. La verificación funcional completa llega en ISS-13.

---

## 15.1 DTOs del feature

```bash
mkdir -p src/features/auth/users/dto
```

**`dto/create-user.dto.ts`**

```bash
: > src/features/auth/users/dto/create-user.dto.ts
cat >> src/features/auth/users/dto/create-user.dto.ts << 'EOF'
/** Datos de entrada de `POST /api/usuarios`. */
export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  avatar?: string | null;
  status?: "active" | "inactive";
}
EOF
```

**`dto/update-user.dto.ts`**

```bash
: > src/features/auth/users/dto/update-user.dto.ts
cat >> src/features/auth/users/dto/update-user.dto.ts << 'EOF'
/**
 * Datos de entrada de `PUT /api/usuarios/:id` (reemplazo completo).
 *
 * Ni `password` ni `status` están aquí a propósito:
 *  - la contraseña tiene su propia operación (`PATCH /api/usuarios/:id/password`);
 *  - el estado solo cambia con el borrado lógico (`/deactivate`).
 */
export interface UpdateUserDto {
  username: string;
  email: string;
  avatar?: string | null;
}
EOF
```

**`dto/patch-user.dto.ts`**

```bash
: > src/features/auth/users/dto/patch-user.dto.ts
cat >> src/features/auth/users/dto/patch-user.dto.ts << 'EOF'
import { UpdateUserDto } from "./update-user.dto";

export type PatchUserDto = Partial<UpdateUserDto>;
EOF
```

**`dto/change-password.dto.ts`**

```bash
: > src/features/auth/users/dto/change-password.dto.ts
cat >> src/features/auth/users/dto/change-password.dto.ts << 'EOF'
/**
 * Datos de entrada de `PATCH /api/usuarios/:id/password`.
 *
 * Exige la contraseña **actual**: nadie puede cambiar la credencial de otro
 * usuario sin conocerla (defensa en profundidad).
 */
export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}
EOF
```

**`dto/user-response.dto.ts`**

```bash
: > src/features/auth/users/dto/user-response.dto.ts
cat >> src/features/auth/users/dto/user-response.dto.ts << 'EOF'
import { User, UserI } from "../user.model";

/** Respuesta HTTP de un usuario. `password` **nunca** sale. */
export type UserResponseDto = Omit<UserI, "password">;

/** Mapper modelo -> DTO de respuesta (objeto plano; elimina `password`). */
export function toUserResponse(user: User): UserResponseDto {
  const { password, ...safe } = user.toJSON() as UserI & { password?: string };
  return safe;
}
EOF
```

**`dto/index.ts`**

```bash
: > src/features/auth/users/dto/index.ts
cat >> src/features/auth/users/dto/index.ts << 'EOF'
export * from "./create-user.dto";
export * from "./update-user.dto";
export * from "./patch-user.dto";
export * from "./change-password.dto";
export * from "./user-response.dto";
EOF
```

---

## 15.2 Repository

```bash
: > src/features/auth/users/users.repository.ts
cat >> src/features/auth/users/users.repository.ts << 'EOF'
import { CreationAttributes, Op, Transaction } from "sequelize";
import { User } from "./user.model";

/**
 * Capa Repository del feature Users.
 *
 * Única que habla con Sequelize (el modelo `User`). No contiene reglas de
 * negocio ni conoce `req`/`res`.
 *
 * Detalle de seguridad: las lecturas **normales** excluyen `password` en la
 * proyección SQL. Solo dos consultas lo incluyen, ambas con nombre explícito
 * en su firma (`...WithPassword`).
 */
export class UsersRepository {
  private static readonly WITHOUT_PASSWORD = { exclude: ["password"] };

  /** Todos los usuarios activos (sin `password`). */
  public async findAllActive(): Promise<User[]> {
    return User.findAll({
      where: { status: "active" },
      attributes: UsersRepository.WITHOUT_PASSWORD,
    });
  }

  /** Un usuario por PK (o `null`), sin `password`. Acepta transacción. */
  public async findById(id: number, transaction?: Transaction): Promise<User | null> {
    return User.findByPk(id, {
      attributes: UsersRepository.WITHOUT_PASSWORD,
      transaction,
    });
  }

  /** Un usuario por PK **con** su hash. Uso exclusivo: cambio de contraseña. */
  public async findByIdWithPassword(id: number): Promise<User | null> {
    return User.findByPk(id);
  }

  /**
   * Un usuario por `username` **o** `email`, con su hash.
   * Uso exclusivo: validación de credenciales en el login.
   */
  public async findByIdentifierWithPassword(identifier: string): Promise<User | null> {
    const value = identifier.trim().toLowerCase();
    return User.findOne({
      where: { [Op.or]: [{ username: value }, { email: value }] },
    });
  }

  /** Busca por `username` o `email` (sin `password`) para detectar duplicados. */
  public async findConflicts(username: string, email: string): Promise<User[]> {
    return User.findAll({
      where: {
        [Op.or]: [
          { username: username.trim().toLowerCase() },
          { email: email.trim().toLowerCase() },
        ],
      },
      attributes: ["id", "username", "email"],
    });
  }

  /** Inserta un usuario (el hook del modelo hashea `password`). */
  public async create(data: CreationAttributes<User>): Promise<User> {
    return User.create(data);
  }

  /** Persiste cambios sobre una instancia existente. */
  public async update(user: User, data: Partial<User>): Promise<User> {
    return user.update(data);
  }

  /** Elimina físicamente una instancia. */
  public async delete(user: User): Promise<void> {
    await user.destroy();
  }
}
EOF
```

---

## 15.3 Service

```bash
: > src/features/auth/users/users.service.ts
cat >> src/features/auth/users/users.service.ts << 'EOF'
import {
  ChangePasswordDto,
  CreateUserDto,
  PatchUserDto,
  UpdateUserDto,
  UserResponseDto,
  toUserResponse,
} from "./dto";
import { UsersRepository } from "./users.repository";
import { User } from "./user.model";
import { AppError } from "../../../shared/errors/app-error";
import { comparePassword } from "../../../shared/auth/password";

/**
 * Capa Service del feature Users.
 *
 * Reglas de negocio: unicidad de `username`/`email`, default de `status`,
 * política de borrado lógico, cambio de credencial y consulta de permisos
 * efectivos.
 */
export class UsersService {
  public constructor(
    private readonly repository: UsersRepository = new UsersRepository()
  ) {}

  // ================== READ ==================
  public async getAll(): Promise<UserResponseDto[]> {
    const users = await this.repository.findAllActive();
    return users.map((user) => toUserResponse(user));
  }

  public async getOne(id: number): Promise<UserResponseDto> {
    return toUserResponse(await this.findOrFail(id));
  }

  // ================== CREATE ==================
  public async create(body: CreateUserDto): Promise<UserResponseDto> {
    await this.assertUnique(body.username, body.email);

    const user = await this.repository.create({
      username: body.username,
      email: body.email,
      password: body.password,
      avatar: body.avatar ?? null,
      status: body.status ?? "active",
    });
    return toUserResponse(user);
  }

  // ================== UPDATE ==================
  public async updatePut(id: number, body: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findOrFail(id);
    await this.assertUnique(body.username, body.email, id);

    await this.repository.update(user, {
      username: body.username,
      email: body.email,
      avatar: body.avatar ?? null,
    });
    return toUserResponse(user);
  }

  public async updatePatch(id: number, body: PatchUserDto): Promise<UserResponseDto> {
    const user = await this.findOrFail(id);

    const username = body.username ?? user.username;
    const email = body.email ?? user.email;
    await this.assertUnique(username, email, id);

    await this.repository.update(user, body);
    return toUserResponse(user);
  }

  /** Cambia la contraseña. Verifica la credencial actual antes de aceptar. */
  public async changePassword(id: number, body: ChangePasswordDto): Promise<void> {
    if (!body.current_password || !body.new_password) {
      throw new AppError(400, "current_password and new_password are required");
    }

    const user = await this.repository.findByIdWithPassword(id);
    if (!user || user.status !== "active") {
      throw new AppError(404, "User not found");
    }

    const matches = await comparePassword(body.current_password, user.password);
    if (!matches) {
      throw new AppError(400, "Current password is incorrect");
    }

    await this.repository.update(user, { password: body.new_password });
  }

  // ================== DELETE ==================
  public async deletePhysical(id: number): Promise<void> {
    const user = await this.findOrFail(id, false);
    await this.repository.delete(user);
  }

  public async deleteLogical(id: number): Promise<UserResponseDto> {
    const user = await this.findOrFail(id);
    await this.repository.update(user, { status: "inactive" });
    return toUserResponse(user);
  }

  // ================== HELPERS ==================
  private async findOrFail(id: number, onlyActive = true): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user || (onlyActive && user.status !== "active")) {
      throw new AppError(404, "User not found");
    }
    return user;
  }

  private async assertUnique(
    username: string,
    email: string,
    excludeId?: number
  ): Promise<void> {
    const conflicts = await this.repository.findConflicts(username, email);
    const taken = conflicts.find((candidate) => candidate.id !== excludeId);

    if (!taken) return;
    if (taken.username === username.trim().toLowerCase()) {
      throw new AppError(409, "Username already in use");
    }
    throw new AppError(409, "Email already in use");
  }
}
EOF
```

> **Nota:** `getEffectivePermissions` **se omite en esta fase** porque depende de `ResourceRolesService` (feature que llega en **ISS-11/12**). Cuando llegues allí, añades el método y su controller.

---

## 15.4 Controller

```bash
: > src/features/auth/users/users.controller.ts
cat >> src/features/auth/users/users.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import {
  ChangePasswordDto,
  CreateUserDto,
  PatchUserDto,
  UpdateUserDto,
} from "./dto";
import { UsersService } from "./users.service";

export class UsersController extends BaseController {
  public constructor(
    private readonly service: UsersService = new UsersService()
  ) {
    super();
  }

  // ================== READ ==================
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const users = await this.service.getAll();
      res.status(200).json({ users });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.getOne(this.paramId(req));
      res.status(200).json({ user });
    });
  }

  // ================== CREATE ==================
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.create(req.body as CreateUserDto);
      res.status(201).json({ user });
    });
  }

  // ================== UPDATE ==================
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.updatePut(
        this.paramId(req),
        req.body as UpdateUserDto
      );
      res.status(200).json({ user });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.updatePatch(
        this.paramId(req),
        req.body as PatchUserDto
      );
      res.status(200).json({ user });
    });
  }

  // ================== DELETE ==================
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "User permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "User deactivated (logical delete)", user });
    });
  }

  // ================== IDENTIDAD ==================
  /** Cambio de credencial (exige la contraseña actual). */
  public async changePassword(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.changePassword(id, req.body as ChangePasswordDto);
      res.status(200).json({ message: "Password updated", id });
    });
  }
}
EOF
```

> **Nota:** el método `getEffectivePermissions` del controller **se omite** aquí y se añade en **ISS-12**.

---

## 15.5 Rutas (modalidad JWT + RBAC)

> **⚠️ IMPORTANTE:** este archivo **importa** `authenticate` y `authorize` desde `../access`, que **aún no existe**. Si pegas este archivo en el ISS-10, el servidor fallará al compilar. **Dos opciones:**
>
> **A) Esperar al ISS-13** para crear este archivo (recomendado).
> **B) Crear el archivo** ahora pero **comentar** los middlewares, para que compile:
>
> ```typescript
> // TODO ISS-13: descomentar cuando exista ../access
> // import { authenticate, authorize } from "../access";
> ```
> Y en cada ruta, en vez de `.get(authenticate, authorize, handler)`, dejar solo `.get(handler)`.

**Versión A (recomendada — la dejas para el ISS-13):**

No crees `users.routes.ts` todavía. El ISS-13 lo completa.

**Versión B (para que compile ya):**

```bash
: > src/features/auth/users/users.routes.ts
cat >> src/features/auth/users/users.routes.ts << 'EOF'
import { Application } from "express";
import { UsersController } from "./users.controller";
// import { authenticate, authorize } from "../access"; // TODO ISS-13

/**
 * Rutas del feature Users.
 *
 * TODO ISS-13: pasar a modalidad JWT + RBAC añadiendo `authenticate, authorize`
 * a cada ruta una vez exista `../access`.
 */
export class UsersRoutes {
  public usersController: UsersController = new UsersController();

  public routes(app: Application): void {
    app
      .route("/api/usuarios")
      .get(this.usersController.getAll.bind(this.usersController));

    app
      .route("/api/usuarios/:id")
      .get(this.usersController.getOne.bind(this.usersController));

    app
      .route("/api/usuarios")
      .post(this.usersController.create.bind(this.usersController));

    app
      .route("/api/usuarios/:id")
      .put(this.usersController.updatePut.bind(this.usersController))
      .patch(this.usersController.updatePatch.bind(this.usersController));

    app
      .route("/api/usuarios/:id")
      .delete(this.usersController.deletePhysical.bind(this.usersController));

    app
      .route("/api/usuarios/:id/deactivate")
      .patch(this.usersController.deleteLogical.bind(this.usersController));

    app
      .route("/api/usuarios/:id/password")
      .patch(this.usersController.changePassword.bind(this.usersController));
  }
}
EOF
```

---

## 15.6 Seeder de usuarios canónicos

```bash
: > src/features/auth/users/users.seeder.ts
cat >> src/features/auth/users/users.seeder.ts << 'EOF'
import { User } from "./user.model";
import { faker } from "@faker-js/faker";

/**
 * Seeder de usuarios (`users`).
 *
 * Crea **dos usuarios canónicos**:
 * | username | password    | rol    |
 * |----------|-------------|--------|
 * | `admin`  | `Admin123!` | ADMIN  |
 * | `seller` | `Seller123!`| SELLER |
 *
 * Idempotente por `username`.
 */
export const SEED_USERS = [
  { username: "admin", email: "admin@textilclean.local", password: "Admin123!" },
  { username: "seller", email: "seller@textilclean.local", password: "Seller123!" },
] as const;

export async function seedUsers(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️  users: count=0, se omite");
    return 0;
  }

  let created = 0;

  for (const item of SEED_USERS) {
    const [user, wasCreated] = await User.findOrCreate({
      where: { username: item.username },
      defaults: {
        username: item.username,
        email: item.email,
        password: item.password,
        avatar: null,
        status: "active",
      },
    });
    if (wasCreated) {
      created++;
      continue;
    }
    if (user.status !== "active") {
      await user.update({ status: "active" });
    }
  }

  const extras = Math.max(0, count - SEED_USERS.length);
  for (let i = 0; i < extras; i++) {
    const username = `user.${i}.${faker.string.alphanumeric(6)}`.toLowerCase();
    await User.create({
      username,
      email: `${username}@example.com`,
      password: "Password123!",
      avatar: null,
      status: "active",
    });
    created++;
  }

  console.log(`✅ users: insertados ${created} usuario(s) (2 canónicos + ${extras} aleatorios)`);
  return created;
}
EOF
```

---

## 15.7 Swagger del feature

```bash
: > src/features/auth/users/users.swagger.ts
cat >> src/features/auth/users/users.swagger.ts << 'EOF'
import {
  bearerSecurity,
  forbiddenResponse,
  invalidIdResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

/**
 * Documentación OpenAPI del feature Users.
 * Modalidad de todas las operaciones: JWT + RBAC.
 */
export const usersSwagger = {
  tags: [
    {
      name: "Usuarios",
      description:
        "CRUD de identidades + cambio de contraseña — **JWT + RBAC**",
    },
  ],
  paths: {
    "/api/usuarios": {
      get: {
        tags: ["Usuarios"],
        summary: "Listar usuarios activos",
        security: bearerSecurity,
        responses: {
          "200": { description: "Lista de usuarios (`{ users: [...] }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
        },
      },
      post: {
        tags: ["Usuarios"],
        summary: "Crear usuario",
        description: "El `password` se hashea (bcrypt, 12 rondas).",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UserCreate" } },
          },
        },
        responses: {
          "201": { description: "Usuario creado (`{ user }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "409": { description: "`username` o `email` ya en uso" },
        },
      },
    },
    "/api/usuarios/{id}": {
      get: {
        tags: ["Usuarios"],
        summary: "Obtener usuario por id",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Usuario (`{ user }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      put: {
        tags: ["Usuarios"],
        summary: "Reemplazar usuario (PUT)",
        description: "No cambia `password` ni `status`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UserUpdate" } },
          },
        },
        responses: {
          "200": { description: "Usuario actualizado (`{ user }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
          "409": { description: "`username` o `email` ya en uso" },
        },
      },
      patch: {
        tags: ["Usuarios"],
        summary: "Modificar usuario (PATCH)",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UserPatch" } },
          },
        },
        responses: {
          "200": { description: "Usuario actualizado (`{ user }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      delete: {
        tags: ["Usuarios"],
        summary: "Eliminar usuario (físico)",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Eliminado (`{ message, id }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/usuarios/{id}/deactivate": {
      patch: {
        tags: ["Usuarios"],
        summary: "Desactivar usuario (borrado lógico)",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Desactivado (`{ message, user }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/usuarios/{id}/password": {
      patch: {
        tags: ["Usuarios"],
        summary: "Cambiar contraseña",
        description: "Exige `current_password` (defensa en profundidad).",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ChangePassword" } },
          },
        },
        responses: {
          "200": { description: "Contraseña actualizada (`{ message, id }`)" },
          "400": { description: "Faltan campos o `current_password` incorrecta" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          username: { type: "string", example: "admin" },
          email: { type: "string", format: "email", example: "admin@textilclean.local" },
          avatar: { type: "string", nullable: true, example: null },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UserCreate: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string", minLength: 3, maxLength: 80 },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password", minLength: 8 },
          avatar: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      UserUpdate: {
        type: "object",
        required: ["username", "email"],
        properties: {
          username: { type: "string" },
          email: { type: "string", format: "email" },
          avatar: { type: "string", nullable: true },
        },
      },
      UserPatch: {
        type: "object",
        properties: {
          username: { type: "string" },
          email: { type: "string", format: "email" },
          avatar: { type: "string", nullable: true },
        },
      },
      ChangePassword: {
        type: "object",
        required: ["current_password", "new_password"],
        properties: {
          current_password: { type: "string", format: "password" },
          new_password: { type: "string", format: "password", minLength: 8 },
        },
      },
    },
  },
};
EOF
```

---

## 15.8 Pruebas HTTP

```bash
mkdir -p src/features/auth/users/http
```

**`http/users.get.http`**

```bash
: > src/features/auth/users/http/users.get.http
cat >> src/features/auth/users/http/users.get.http << 'EOF'
### Feature Users — GET (SIN AUTH temporalmente hasta ISS-13)
@baseUrl = http://localhost:3000
@id = 1

### getAll
GET {{baseUrl}}/api/usuarios

### getOne
GET {{baseUrl}}/api/usuarios/{{id}}

### 400 — id no entero
GET {{baseUrl}}/api/usuarios/abc
EOF
```

**`http/users.create.http`**

```bash
: > src/features/auth/users/http/users.create.http
cat >> src/features/auth/users/http/users.create.http << 'EOF'
### Feature Users — CREATE / UPDATE / DELETE
@baseUrl = http://localhost:3000
@id = 2

### CREATE
POST {{baseUrl}}/api/usuarios
Content-Type: application/json

{
  "username": "nuevo.usuario",
  "email": "nuevo.usuario@textilclean.local",
  "password": "Password123!",
  "avatar": null
}

### 409 — username/email ya en uso
POST {{baseUrl}}/api/usuarios
Content-Type: application/json

{
  "username": "admin",
  "email": "otro@textilclean.local",
  "password": "Password123!"
}

### PUT
PUT {{baseUrl}}/api/usuarios/{{id}}
Content-Type: application/json

{
  "username": "seller",
  "email": "seller@textilclean.local",
  "avatar": null
}

### PATCH
PATCH {{baseUrl}}/api/usuarios/{{id}}
Content-Type: application/json

{ "avatar": "https://example.com/avatar.png" }

### CAMBIO DE CONTRASEÑA
PATCH {{baseUrl}}/api/usuarios/{{id}}/password
Content-Type: application/json

{
  "current_password": "Seller123!",
  "new_password": "Seller456!"
}

### DELETE lógico
PATCH {{baseUrl}}/api/usuarios/{{id}}/deactivate

### DELETE físico
DELETE {{baseUrl}}/api/usuarios/{{id}}
EOF
```

---

## Cableado

**PARCHE — `src/routes/index.ts`**

Añadir el import y la propiedad:

```typescript
import { UsersRoutes } from "../features/auth/users/users.routes";
// ...
public usersRoutes: UsersRoutes = new UsersRoutes();
```

**PARCHE — `src/config/index.ts`**

Dentro de `routes()`, **solo si usaste la Versión B de las rutas**, añadir:

```typescript
    this.routePrv.usersRoutes.routes(this.app);
```

> ⚠️ Si usaste la **Versión A** (no crear `users.routes.ts`), no añadas esta línea hasta el ISS-13.

**PARCHE — `src/database/seeders/counts.ts`**

Añadir `users: number;` dentro de `SeedCounts` y `users: 2,` dentro de `DEFAULT_SEED_COUNTS`.

Añadir la lectura de `SEED_USERS`:

```typescript
  const envUsers = process.env.SEED_USERS;
  if (envUsers !== undefined && envUsers !== "") {
    counts.users = Number(envUsers);
  }
```

**PARCHE — `src/database/seeders/index.ts`**

Añadir:

```typescript
import { seedUsers } from "../../features/auth/users/users.seeder";
// ...
await seedUsers(counts.users);
```

**PARCHE — `src/swagger/index.ts`**

Añadir el import y registrarlo:

```typescript
import { usersSwagger } from "../features/auth/users/users.swagger";
// ...
const featureSwaggerModules: FeatureSwaggerModule[] = [
  clientsSwagger,
  productTypesSwagger,
  productsSwagger,
  salesSwagger,
  productSalesSwagger,
  usersSwagger,
];
```

---

## Verificación

```bash
npx tsc --noEmit
npm run db:seed
npm run dev
```

> **Aviso:** con la **Versión B**, `/api/usuarios` responde **200** (SIN AUTH temporalmente). Con la **Versión A**, ni siquiera está montado. La verificación funcional completa llega en ISS-13.

---

## DoD del ISS-10

- [ ] Todos los criterios de aceptación (15.1 … 15.8) cumplidos
- [ ] La contraseña nunca aparece en una respuesta (`toUserResponse` la excluye)
- [ ] `POST /api/usuarios` con username repetido → **409**
- [ ] `PATCH /api/usuarios/:id/password` cambia el hash y es verificable con `comparePassword`
- [ ] `npx tsc --noEmit` sin errores y `npm run dev` arranca

---

## ✅ GATE de la unidad ISS-10

Con el GATE en verde queda habilitado **ISS-11 · Features Roles y Resources**.

---

**Navegación de la ruta:** ← ISS-10 · 🧠 Aprender · ↑ Ruta Express · → ISS-11 · 🧠 Aprender