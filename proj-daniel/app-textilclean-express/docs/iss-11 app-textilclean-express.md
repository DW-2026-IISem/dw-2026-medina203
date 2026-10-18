# 🛠 ISS-11 · Features Roles y Resources (catálogo de autorización) — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase II:** Auth con RBAC.
**Feature / tablas:** `features/auth/roles/` · `roles` — `features/auth/resources/` · `resources`
**API:** `/api/roles…` y `/api/recursos…` — **JWT + RBAC**
**Depende de:** ISS-10 — Feature Users.
**Habilita:** ISS-12 — Asignaciones y concesiones.

**Objetivo:** construir los dos extremos del permiso:
- **Role** — el sujeto (a quién se concede).
- **Resource** — el objeto (qué se concede), un par `(method, path)`.

Este ISS crea el CRUD administrativo de ambos y el **catálogo semilla de los 58 recursos** del sistema. Las concesiones (el acto de unirlos) son el ISS-12.

---

## Criterios de aceptación (ISS-11)

- [ ] 16.1 `features/auth/roles/dto/` completo
- [ ] 16.2 `roles.repository.ts`, `roles.service.ts`, `roles.controller.ts`, `roles.routes.ts`
- [ ] 16.3 `roles.seeder.ts` (ADMIN, SELLER, idempotente) y `roles.swagger.ts`
- [ ] 16.4 `features/auth/resources/dto/` + `resource-catalog.ts` con **58 recursos**
- [ ] 16.5 `resources.repository.ts`, `resources.service.ts`, `resources.controller.ts`, `resources.routes.ts`
- [ ] 16.6 `resources.seeder.ts` (carga el catálogo) y `resources.swagger.ts`
- [ ] 16.7 Archivos `.http` de ambos features
- [ ] `npx tsc --noEmit` OK

> **⚠️ Recordatorio:** este ISS importa `../access` (`authenticate`, `authorize`) que aún **no existe**. Tienes 2 opciones:
> - **A (recomendada):** crear los archivos `*.routes.ts` pero con los middlewares **comentados** para que compile. En ISS-13 los activas.
> - **B:** no crear los `*.routes.ts` todavía y dejar que ISS-13 los traiga completos.

Las instrucciones de abajo **asumen la opción A** (rutas creadas, middlewares comentados).

---

## 16.1 Feature Roles — DTOs

```bash
mkdir -p src/features/auth/roles/dto
mkdir -p src/features/auth/roles/http
```

**`dto/create-role.dto.ts`**

```bash
: > src/features/auth/roles/dto/create-role.dto.ts
cat >> src/features/auth/roles/dto/create-role.dto.ts << 'EOF'
/** Datos de entrada de `POST /api/roles`. `name` se normaliza a MAYÚSCULAS. */
export interface CreateRoleDto {
  name: string;
  description?: string | null;
  status?: "active" | "inactive";
}
EOF
```

**`dto/update-role.dto.ts`**

```bash
: > src/features/auth/roles/dto/update-role.dto.ts
cat >> src/features/auth/roles/dto/update-role.dto.ts << 'EOF'
/**
 * Datos de entrada de `PUT /api/roles/:id`.
 * `status` no está aquí: el estado solo cambia con el borrado lógico.
 */
export interface UpdateRoleDto {
  name: string;
  description?: string | null;
}
EOF
```

**`dto/patch-role.dto.ts`**

```bash
: > src/features/auth/roles/dto/patch-role.dto.ts
cat >> src/features/auth/roles/dto/patch-role.dto.ts << 'EOF'
import { UpdateRoleDto } from "./update-role.dto";

export type PatchRoleDto = Partial<UpdateRoleDto>;
EOF
```

**`dto/role-response.dto.ts`**

```bash
: > src/features/auth/roles/dto/role-response.dto.ts
cat >> src/features/auth/roles/dto/role-response.dto.ts << 'EOF'
import { Role, RoleI } from "../role.model";

export type RoleResponseDto = RoleI;

export function toRoleResponse(role: Role): RoleResponseDto {
  return role.toJSON() as RoleI;
}
EOF
```

**`dto/index.ts`**

```bash
: > src/features/auth/roles/dto/index.ts
cat >> src/features/auth/roles/dto/index.ts << 'EOF'
export * from "./create-role.dto";
export * from "./update-role.dto";
export * from "./patch-role.dto";
export * from "./role-response.dto";
EOF
```

---

## 16.2 Feature Roles — repository, service, controller y rutas

**`roles.repository.ts`**

```bash
: > src/features/auth/roles/roles.repository.ts
cat >> src/features/auth/roles/roles.repository.ts << 'EOF'
import { CreationAttributes, Transaction } from "sequelize";
import { Role } from "./role.model";

export class RolesRepository {
  public async findAllActive(): Promise<Role[]> {
    return Role.findAll({ where: { status: "active" } });
  }

  public async findById(id: number, transaction?: Transaction): Promise<Role | null> {
    return Role.findByPk(id, { transaction });
  }

  public async findByName(name: string): Promise<Role | null> {
    return Role.findOne({ where: { name: name.trim().toUpperCase() } });
  }

  public async create(data: CreationAttributes<Role>): Promise<Role> {
    return Role.create(data);
  }

  public async update(role: Role, data: Partial<Role>): Promise<Role> {
    return role.update(data);
  }

  public async delete(role: Role): Promise<void> {
    await role.destroy();
  }
}
EOF
```

**`roles.service.ts`**

```bash
: > src/features/auth/roles/roles.service.ts
cat >> src/features/auth/roles/roles.service.ts << 'EOF'
import {
  CreateRoleDto,
  PatchRoleDto,
  RoleResponseDto,
  UpdateRoleDto,
  toRoleResponse,
} from "./dto";
import { RolesRepository } from "./roles.repository";
import { Role } from "./role.model";
import { AppError } from "../../../shared/errors/app-error";

export class RolesService {
  public constructor(
    private readonly repository: RolesRepository = new RolesRepository()
  ) {}

  // ================== READ ==================
  public async getAll(): Promise<RoleResponseDto[]> {
    const roles = await this.repository.findAllActive();
    return roles.map((role) => toRoleResponse(role));
  }

  public async getOne(id: number): Promise<RoleResponseDto> {
    return toRoleResponse(await this.findOrFail(id));
  }

  // ================== CREATE ==================
  public async create(body: CreateRoleDto): Promise<RoleResponseDto> {
    if (!body.name) throw new AppError(400, "name is required");
    await this.assertNameAvailable(body.name);

    const role = await this.repository.create({
      name: body.name,
      description: body.description ?? null,
      status: body.status ?? "active",
    });
    return toRoleResponse(role);
  }

  // ================== UPDATE ==================
  public async updatePut(id: number, body: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.findOrFail(id);
    await this.assertNameAvailable(body.name, id);

    await this.repository.update(role, {
      name: body.name,
      description: body.description ?? null,
    });
    return toRoleResponse(role);
  }

  public async updatePatch(id: number, body: PatchRoleDto): Promise<RoleResponseDto> {
    const role = await this.findOrFail(id);
    if (body.name) await this.assertNameAvailable(body.name, id);

    await this.repository.update(role, body);
    return toRoleResponse(role);
  }

  // ================== DELETE ==================
  public async deletePhysical(id: number): Promise<void> {
    const role = await this.findOrFail(id, false);
    await this.repository.delete(role);
  }

  public async deleteLogical(id: number): Promise<RoleResponseDto> {
    const role = await this.findOrFail(id);
    await this.repository.update(role, { status: "inactive" });
    return toRoleResponse(role);
  }

  // ================== HELPERS ==================
  private async findOrFail(id: number, onlyActive = true): Promise<Role> {
    const role = await this.repository.findById(id);
    if (!role || (onlyActive && role.status !== "active")) {
      throw new AppError(404, "Role not found");
    }
    return role;
  }

  private async assertNameAvailable(name: string, excludeId?: number): Promise<void> {
    const existing = await this.repository.findByName(name);
    if (existing && existing.id !== excludeId) {
      throw new AppError(409, "Role name already in use");
    }
  }
}
EOF
```

**`roles.controller.ts`**

```bash
: > src/features/auth/roles/roles.controller.ts
cat >> src/features/auth/roles/roles.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CreateRoleDto, PatchRoleDto, UpdateRoleDto } from "./dto";
import { RolesService } from "./roles.service";

export class RolesController extends BaseController {
  public constructor(
    private readonly service: RolesService = new RolesService()
  ) {
    super();
  }

  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const roles = await this.service.getAll();
      res.status(200).json({ roles });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const role = await this.service.getOne(this.paramId(req));
      res.status(200).json({ role });
    });
  }

  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const role = await this.service.create(req.body as CreateRoleDto);
      res.status(201).json({ role });
    });
  }

  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const role = await this.service.updatePut(
        this.paramId(req),
        req.body as UpdateRoleDto
      );
      res.status(200).json({ role });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const role = await this.service.updatePatch(
        this.paramId(req),
        req.body as PatchRoleDto
      );
      res.status(200).json({ role });
    });
  }

  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Role permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const role = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "Role deactivated (logical delete)", role });
    });
  }
}
EOF
```

**`roles.routes.ts`** (con middlewares comentados hasta ISS-13)

```bash
: > src/features/auth/roles/roles.routes.ts
cat >> src/features/auth/roles/roles.routes.ts << 'EOF'
import { Application } from "express";
import { RolesController } from "./roles.controller";
// import { authenticate, authorize } from "../access"; // TODO ISS-13

/**
 * Rutas del feature Roles.
 * TODO ISS-13: pasar a modalidad JWT + RBAC añadiendo `authenticate, authorize`.
 */
export class RolesRoutes {
  public rolesController: RolesController = new RolesController();

  public routes(app: Application): void {
    app.route("/api/roles")
      .get(this.rolesController.getAll.bind(this.rolesController))
      .post(this.rolesController.create.bind(this.rolesController));

    app.route("/api/roles/:id")
      .get(this.rolesController.getOne.bind(this.rolesController))
      .put(this.rolesController.updatePut.bind(this.rolesController))
      .patch(this.rolesController.updatePatch.bind(this.rolesController))
      .delete(this.rolesController.deletePhysical.bind(this.rolesController));

    app.route("/api/roles/:id/deactivate")
      .patch(this.rolesController.deleteLogical.bind(this.rolesController));
  }
}
EOF
```

---

## 16.3 Feature Roles — seeder y swagger

**`roles.seeder.ts`**

```bash
: > src/features/auth/roles/roles.seeder.ts
cat >> src/features/auth/roles/roles.seeder.ts << 'EOF'
import { Role } from "./role.model";

/**
 * Seeder del catálogo de roles (`roles`).
 * Crea los dos roles de referencia. Determinista e idempotente.
 * Los roles nacen **sin permisos**: las concesiones las crea el seeder de
 * `resource_roles` (ISS-12).
 */
export const SEED_ROLES = [
  { name: "ADMIN", description: "Administración del sistema: gestiona usuarios, roles y permisos" },
  { name: "SELLER", description: "Operación de ventas: consulta catálogo y registra ventas" },
] as const;

export async function seedRoles(): Promise<number> {
  let created = 0;

  for (const item of SEED_ROLES) {
    const [role, wasCreated] = await Role.findOrCreate({
      where: { name: item.name },
      defaults: { name: item.name, description: item.description, status: "active" },
    });

    if (wasCreated) {
      created++;
      continue;
    }
    if (role.status !== "active") {
      await role.update({ status: "active" });
    }
  }

  console.log(`✅ roles: catálogo reconciliado (${SEED_ROLES.length} roles, ${created} nuevos)`);
  return created;
}
EOF
```

**`roles.swagger.ts`**

```bash
: > src/features/auth/roles/roles.swagger.ts
cat >> src/features/auth/roles/roles.swagger.ts << 'EOF'
import {
  bearerSecurity,
  forbiddenResponse,
  invalidIdResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

export const rolesSwagger = {
  tags: [
    { name: "Roles", description: "CRUD de roles (agrupadores de permisos) — **JWT + RBAC**" },
  ],
  paths: {
    "/api/roles": {
      get: {
        tags: ["Roles"],
        summary: "Listar roles activos",
        security: bearerSecurity,
        responses: {
          "200": { description: "Lista de roles (`{ roles: [...] }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
        },
      },
      post: {
        tags: ["Roles"],
        summary: "Crear rol",
        description: "El rol nace **sin permisos**; se conceden en ISS-12.",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RoleCreate" } },
          },
        },
        responses: {
          "201": { description: "Rol creado (`{ role }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "409": { description: "Nombre de rol ya en uso" },
        },
      },
    },
    "/api/roles/{id}": {
      get: {
        tags: ["Roles"],
        summary: "Obtener rol por id",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Rol (`{ role }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      put: {
        tags: ["Roles"],
        summary: "Reemplazar rol (PUT)",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RoleUpdate" } },
          },
        },
        responses: {
          "200": { description: "Rol actualizado (`{ role }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      patch: {
        tags: ["Roles"],
        summary: "Modificar rol (PATCH)",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RolePatch" } },
          },
        },
        responses: {
          "200": { description: "Rol actualizado (`{ role }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      delete: {
        tags: ["Roles"],
        summary: "Eliminar rol (físico)",
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
    "/api/roles/{id}/deactivate": {
      patch: {
        tags: ["Roles"],
        summary: "Desactivar rol (borrado lógico)",
        description: "Efecto inmediato: todos los usuarios del rol pierden sus permisos.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Desactivado (`{ message, role }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      Role: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "SELLER" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RoleCreate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "BUYER" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      RoleUpdate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          description: { type: "string", nullable: true },
        },
      },
      RolePatch: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string", nullable: true },
        },
      },
    },
  },
};
EOF
```

---

## 16.4 Feature Resources — DTOs y catálogo semilla

```bash
mkdir -p src/features/auth/resources/dto
mkdir -p src/features/auth/resources/http
```

**`dto/create-resource.dto.ts`**

```bash
: > src/features/auth/resources/dto/create-resource.dto.ts
cat >> src/features/auth/resources/dto/create-resource.dto.ts << 'EOF'
export interface CreateResourceDto {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description?: string | null;
  status?: "active" | "inactive";
}
EOF
```

**`dto/update-resource.dto.ts`**

```bash
: > src/features/auth/resources/dto/update-resource.dto.ts
cat >> src/features/auth/resources/dto/update-resource.dto.ts << 'EOF'
export interface UpdateResourceDto {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description?: string | null;
}
EOF
```

**`dto/patch-resource.dto.ts`**

```bash
: > src/features/auth/resources/dto/patch-resource.dto.ts
cat >> src/features/auth/resources/dto/patch-resource.dto.ts << 'EOF'
import { UpdateResourceDto } from "./update-resource.dto";

export type PatchResourceDto = Partial<UpdateResourceDto>;
EOF
```

**`dto/resource-response.dto.ts`**

```bash
: > src/features/auth/resources/dto/resource-response.dto.ts
cat >> src/features/auth/resources/dto/resource-response.dto.ts << 'EOF'
import { Resource, ResourceI } from "../resource.model";

export type ResourceResponseDto = ResourceI;

export function toResourceResponse(resource: Resource): ResourceResponseDto {
  return resource.toJSON() as ResourceI;
}
EOF
```

**`dto/index.ts`**

```bash
: > src/features/auth/resources/dto/index.ts
cat >> src/features/auth/resources/dto/index.ts << 'EOF'
export * from "./create-resource.dto";
export * from "./update-resource.dto";
export * from "./patch-resource.dto";
export * from "./resource-response.dto";
EOF
```

**`resource-catalog.ts`** — 58 recursos adaptados a textilclean

```bash
: > src/features/auth/resources/resource-catalog.ts
cat >> src/features/auth/resources/resource-catalog.ts << 'EOF'
/**
 * Catálogo de los **58 recursos** del sistema (fuente única).
 *
 * Un recurso es un par `(method, path)`; un permiso es la concesión de un
 * recurso a un rol. Este archivo es la definición en código del catálogo que
 * puebla el seeder de `resources` y del que se derivan las concesiones de los
 * roles (`ADMIN` recibe los 58; `SELLER`, los 7 marcados con `seller: true`).
 */
export interface CatalogResource {
  method: string;
  path: string;
  description: string;
  /** `true` si el rol `SELLER` recibe esta concesión (7 en total). */
  seller?: boolean;
}

export const RESOURCE_CATALOG: readonly CatalogResource[] = [
  // ── Clientes (7) ──────────────────────────────────────────────
  { method: "GET", path: "/api/clientes", description: "Listar clientes", seller: true },
  { method: "GET", path: "/api/clientes/:id", description: "Consultar cliente", seller: true },
  { method: "POST", path: "/api/clientes", description: "Crear cliente" },
  { method: "PUT", path: "/api/clientes/:id", description: "Reemplazar cliente" },
  { method: "PATCH", path: "/api/clientes/:id", description: "Modificar cliente" },
  { method: "DELETE", path: "/api/clientes/:id", description: "Eliminar cliente" },
  { method: "PATCH", path: "/api/clientes/:id/deactivate", description: "Desactivar cliente" },

  // ── Tipos de producto (7) ─────────────────────────────────────
  { method: "GET", path: "/api/tipos-producto", description: "Listar tipos de producto" },
  { method: "GET", path: "/api/tipos-producto/:id", description: "Consultar tipo de producto" },
  { method: "POST", path: "/api/tipos-producto", description: "Crear tipo de producto" },
  { method: "PUT", path: "/api/tipos-producto/:id", description: "Reemplazar tipo de producto" },
  { method: "PATCH", path: "/api/tipos-producto/:id", description: "Modificar tipo de producto" },
  { method: "DELETE", path: "/api/tipos-producto/:id", description: "Eliminar tipo de producto" },
  { method: "PATCH", path: "/api/tipos-producto/:id/deactivate", description: "Desactivar tipo de producto" },

  // ── Productos (7) ─────────────────────────────────────────────
  { method: "GET", path: "/api/productos", description: "Listar productos", seller: true },
  { method: "GET", path: "/api/productos/:id", description: "Consultar producto", seller: true },
  { method: "POST", path: "/api/productos", description: "Crear producto" },
  { method: "PUT", path: "/api/productos/:id", description: "Reemplazar producto" },
  { method: "PATCH", path: "/api/productos/:id", description: "Modificar producto" },
  { method: "DELETE", path: "/api/productos/:id", description: "Eliminar producto" },
  { method: "PATCH", path: "/api/productos/:id/deactivate", description: "Desactivar producto" },

  // ── Ventas (3) ────────────────────────────────────────────────
  { method: "GET", path: "/api/ventas", description: "Listar ventas", seller: true },
  { method: "GET", path: "/api/ventas/:id", description: "Consultar venta", seller: true },
  { method: "POST", path: "/api/ventas", description: "Registrar venta", seller: true },

  // ── Detalle de ventas (1) ─────────────────────────────────────
  { method: "GET", path: "/api/detalle-ventas", description: "Listar detalle de ventas" },

  // ── Usuarios (9) ──────────────────────────────────────────────
  { method: "GET", path: "/api/usuarios", description: "Listar usuarios" },
  { method: "GET", path: "/api/usuarios/:id", description: "Consultar usuario" },
  { method: "POST", path: "/api/usuarios", description: "Crear usuario" },
  { method: "PUT", path: "/api/usuarios/:id", description: "Reemplazar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id", description: "Modificar usuario" },
  { method: "DELETE", path: "/api/usuarios/:id", description: "Eliminar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id/deactivate", description: "Desactivar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id/password", description: "Cambiar contraseña de usuario" },
  { method: "GET", path: "/api/usuarios/:id/permisos", description: "Consultar permisos efectivos" },

  // ── Roles (7) ─────────────────────────────────────────────────
  { method: "GET", path: "/api/roles", description: "Listar roles" },
  { method: "GET", path: "/api/roles/:id", description: "Consultar rol" },
  { method: "POST", path: "/api/roles", description: "Crear rol" },
  { method: "PUT", path: "/api/roles/:id", description: "Reemplazar rol" },
  { method: "PATCH", path: "/api/roles/:id", description: "Modificar rol" },
  { method: "DELETE", path: "/api/roles/:id", description: "Eliminar rol" },
  { method: "PATCH", path: "/api/roles/:id/deactivate", description: "Desactivar rol" },

  // ── Recursos (7) ──────────────────────────────────────────────
  { method: "GET", path: "/api/recursos", description: "Listar recursos" },
  { method: "GET", path: "/api/recursos/:id", description: "Consultar recurso" },
  { method: "POST", path: "/api/recursos", description: "Crear recurso" },
  { method: "PUT", path: "/api/recursos/:id", description: "Reemplazar recurso" },
  { method: "PATCH", path: "/api/recursos/:id", description: "Modificar recurso" },
  { method: "DELETE", path: "/api/recursos/:id", description: "Eliminar recurso" },
  { method: "PATCH", path: "/api/recursos/:id/deactivate", description: "Desactivar recurso" },

  // ── Asignaciones usuario ↔ rol (5) ────────────────────────────
  { method: "GET", path: "/api/asignaciones-rol", description: "Listar asignaciones usuario-rol" },
  { method: "GET", path: "/api/asignaciones-rol/:id", description: "Consultar asignación" },
  { method: "POST", path: "/api/asignaciones-rol", description: "Asignar rol a usuario" },
  { method: "PATCH", path: "/api/asignaciones-rol/:id/deactivate", description: "Retirar rol" },
  { method: "PATCH", path: "/api/asignaciones-rol/:id/reactivate", description: "Reactivar rol" },

  // ── Concesiones rol ↔ recurso (5) ─────────────────────────────
  { method: "GET", path: "/api/concesiones-rol", description: "Listar concesiones rol-recurso" },
  { method: "GET", path: "/api/concesiones-rol/:id", description: "Consultar concesión" },
  { method: "POST", path: "/api/concesiones-rol", description: "Conceder recurso a rol" },
  { method: "PATCH", path: "/api/concesiones-rol/:id/deactivate", description: "Retirar recurso" },
  { method: "PATCH", path: "/api/concesiones-rol/:id/reactivate", description: "Reactivar recurso" },
];

/** Recursos que recibe el rol `SELLER` (7). Derivado del catálogo, no duplicado. */
export const SELLER_RESOURCES: readonly CatalogResource[] = RESOURCE_CATALOG.filter(
  (resource) => resource.seller === true
);
EOF
```

---

## 16.5 Feature Resources — repository, service, controller y rutas

**`resources.repository.ts`**

```bash
: > src/features/auth/resources/resources.repository.ts
cat >> src/features/auth/resources/resources.repository.ts << 'EOF'
import { CreationAttributes, Transaction } from "sequelize";
import { Resource } from "./resource.model";
import { normalizePath } from "../../../shared/auth/resource-match";

export class ResourcesRepository {
  public async findAllActive(): Promise<Resource[]> {
    return Resource.findAll({ where: { status: "active" } });
  }

  public async findById(id: number, transaction?: Transaction): Promise<Resource | null> {
    return Resource.findByPk(id, { transaction });
  }

  public async findByOperation(method: string, path: string): Promise<Resource | null> {
    return Resource.findOne({
      where: { method: method.trim().toUpperCase(), path: normalizePath(path.trim()) },
    });
  }

  public async create(data: CreationAttributes<Resource>): Promise<Resource> {
    return Resource.create(data);
  }

  public async update(resource: Resource, data: Partial<Resource>): Promise<Resource> {
    return resource.update(data);
  }

  public async delete(resource: Resource): Promise<void> {
    await resource.destroy();
  }
}
EOF
```

**`resources.service.ts`**

```bash
: > src/features/auth/resources/resources.service.ts
cat >> src/features/auth/resources/resources.service.ts << 'EOF'
import {
  CreateResourceDto,
  PatchResourceDto,
  ResourceResponseDto,
  UpdateResourceDto,
  toResourceResponse,
} from "./dto";
import { ResourcesRepository } from "./resources.repository";
import { Resource } from "./resource.model";
import { AppError } from "../../../shared/errors/app-error";

export class ResourcesService {
  public constructor(
    private readonly repository: ResourcesRepository = new ResourcesRepository()
  ) {}

  public async getAll(): Promise<ResourceResponseDto[]> {
    const resources = await this.repository.findAllActive();
    return resources.map((resource) => toResourceResponse(resource));
  }

  public async getOne(id: number): Promise<ResourceResponseDto> {
    return toResourceResponse(await this.findOrFail(id));
  }

  public async create(body: CreateResourceDto): Promise<ResourceResponseDto> {
    if (!body.method || !body.path) {
      throw new AppError(400, "method and path are required");
    }
    await this.assertOperationAvailable(body.method, body.path);

    const resource = await this.repository.create({
      method: body.method,
      path: body.path,
      description: body.description ?? null,
      status: body.status ?? "active",
    });
    return toResourceResponse(resource);
  }

  public async updatePut(id: number, body: UpdateResourceDto): Promise<ResourceResponseDto> {
    const resource = await this.findOrFail(id);
    await this.assertOperationAvailable(body.method, body.path, id);

    await this.repository.update(resource, {
      method: body.method,
      path: body.path,
      description: body.description ?? null,
    });
    return toResourceResponse(resource);
  }

  public async updatePatch(id: number, body: PatchResourceDto): Promise<ResourceResponseDto> {
    const resource = await this.findOrFail(id);

    const method = body.method ?? resource.method;
    const path = body.path ?? resource.path;
    await this.assertOperationAvailable(method, path, id);

    await this.repository.update(resource, body);
    return toResourceResponse(resource);
  }

  public async deletePhysical(id: number): Promise<void> {
    const resource = await this.findOrFail(id, false);
    await this.repository.delete(resource);
  }

  public async deleteLogical(id: number): Promise<ResourceResponseDto> {
    const resource = await this.findOrFail(id);
    await this.repository.update(resource, { status: "inactive" });
    return toResourceResponse(resource);
  }

  private async findOrFail(id: number, onlyActive = true): Promise<Resource> {
    const resource = await this.repository.findById(id);
    if (!resource || (onlyActive && resource.status !== "active")) {
      throw new AppError(404, "Resource not found");
    }
    return resource;
  }

  private async assertOperationAvailable(
    method: string,
    path: string,
    excludeId?: number
  ): Promise<void> {
    const existing = await this.repository.findByOperation(method, path);
    if (existing && existing.id !== excludeId) {
      throw new AppError(409, `Resource ${method.toUpperCase()} ${path} already exists`);