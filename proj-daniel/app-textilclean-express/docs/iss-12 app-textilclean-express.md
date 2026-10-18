# 🛠 ISS-12 · Features RoleUsers y ResourceRoles (asignar roles y conceder permisos) — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase II:** Auth con RBAC.
**Feature / tablas:** `features/auth/role-users/` · `role_users` — `features/auth/resource-roles/` · `resource_roles`
**API:** `/api/asignaciones-rol…` y `/api/concesiones-rol…` — **JWT + RBAC**
**Depende de:** ISS-11 — Features Roles y Resources.
**Habilita:** ISS-13 — Middlewares de acceso.

**Objetivo:** construir las dos tablas pivote que convierten el modelo en autorización real:

```
User   ──(RoleUser)────▶  Role   ──(ResourceRole)────▶  Resource
        «quién tiene        «qué agrupa»       «qué se concede»
         qué rol»
```

Sin estas dos features, `Role` y `Resource` serían catálogos inertes.

> **⚠️ Recordatorio:** este ISS importa `../access` (`authenticate`, `authorize`) que aún **no existe**. Tienes 2 opciones:
> - **A (recomendada):** crear los `*.routes.ts` con los middlewares **comentados**. En ISS-13 los activas.
> - **B:** no crear los `*.routes.ts` todavía y dejar que ISS-13 los traiga completos.
>
> Las instrucciones abajo asumen la **opción A**.

---

## Criterios de aceptación (ISS-12)

- [ ] 17.1 `role-users/dto/` (`create-role-user.dto.ts`, `role-user-response.dto.ts`, `index.ts`)
- [ ] 17.2 `role-users.{repository,service,controller,routes}.ts`; `POST /api/asignaciones-rol` idempotente
- [ ] 17.3 `role-users.seeder.ts` (admin→ADMIN, seller→SELLER) y `role-users.swagger.ts`
- [ ] 17.4 `resource-roles/dto/` (`create-resource-role.dto.ts`, `list-resource-roles.dto.ts`, `resource-role-response.dto.ts`, `index.ts`)
- [ ] 17.5 `resource-roles.{repository,service,controller,routes}.ts`; `POST /api/concesiones-rol` idempotente y `/deactivate` · `/reactivate`
- [ ] 17.6 `ResourceRolesService.reconcileRole(roleId, resourceIds)` determinista
- [ ] 17.7 `resource-roles.seeder.ts` construye la matriz (**ADMIN 58, SELLER 7**) y `resource-roles.swagger.ts`
- [ ] 17.8 Archivos `.http` de ambos features
- [ ] `npx tsc --noEmit` OK

```bash
mkdir -p src/features/auth/role-users/dto
mkdir -p src/features/auth/role-users/http
mkdir -p src/features/auth/resource-roles/dto
mkdir -p src/features/auth/resource-roles/http
```

---

## 17.1 DTOs de RoleUsers

**`dto/create-role-user.dto.ts`**

```bash
: > src/features/auth/role-users/dto/create-role-user.dto.ts
cat >> src/features/auth/role-users/dto/create-role-user.dto.ts << 'EOF'
/**
 * Datos de entrada de `POST /api/asignaciones-rol` — **asignar un rol a un usuario**.
 */
export interface CreateRoleUserDto {
  user_id: number;
  role_id: number;
}
EOF
```

**`dto/role-user-response.dto.ts`**

```bash
: > src/features/auth/role-users/dto/role-user-response.dto.ts
cat >> src/features/auth/role-users/dto/role-user-response.dto.ts << 'EOF'
import { RoleUser, RoleUserI } from "../role-user.model";

export interface RoleUserResponseDto extends RoleUserI {
  user?: { id: number; username: string; email: string } | null;
  role?: { id: number; name: string } | null;
}

export function toRoleUserResponse(roleUser: RoleUser): RoleUserResponseDto {
  return roleUser.toJSON() as RoleUserResponseDto;
}
EOF
```

**`dto/index.ts`**

```bash
: > src/features/auth/role-users/dto/index.ts
cat >> src/features/auth/role-users/dto/index.ts << 'EOF'
export * from "./create-role-user.dto";
export * from "./role-user-response.dto";
EOF
```

---

## 17.2 RoleUsers — repository, service, controller y rutas

**`role-users.repository.ts`**

```bash
: > src/features/auth/role-users/role-users.repository.ts
cat >> src/features/auth/role-users/role-users.repository.ts << 'EOF'
import { CreationAttributes, Transaction } from "sequelize";
import { RoleUser } from "./role-user.model";
import { Role } from "../roles/role.model";
import { User } from "../users/user.model";

const SUMMARIES = [
  { model: User, as: "user", attributes: ["id", "username", "email"] },
  { model: Role, as: "role", attributes: ["id", "name"] },
];

export class RoleUsersRepository {
  public async findAllActive(): Promise<RoleUser[]> {
    return RoleUser.findAll({ where: { status: "active" }, include: SUMMARIES });
  }

  public async findById(id: number, transaction?: Transaction): Promise<RoleUser | null> {
    return RoleUser.findByPk(id, { include: SUMMARIES, transaction });
  }

  public async findByUserAndRole(userId: number, roleId: number): Promise<RoleUser | null> {
    return RoleUser.findOne({ where: { user_id: userId, role_id: roleId } });
  }

  public async create(data: CreationAttributes<RoleUser>): Promise<RoleUser> {
    return RoleUser.create(data);
  }

  public async update(roleUser: RoleUser, data: Partial<RoleUser>): Promise<RoleUser> {
    return roleUser.update(data);
  }
}
EOF
```

**`role-users.service.ts`**

```bash
: > src/features/auth/role-users/role-users.service.ts
cat >> src/features/auth/role-users/role-users.service.ts << 'EOF'
import {
  CreateRoleUserDto,
  RoleUserResponseDto,
  toRoleUserResponse,
} from "./dto";
import { RoleUsersRepository } from "./role-users.repository";
import { RoleUser } from "./role-user.model";
import { UsersRepository } from "../users/users.repository";
import { RolesRepository } from "../roles/roles.repository";
import { AppError } from "../../../shared/errors/app-error";

export class RoleUsersService {
  public constructor(
    private readonly repository: RoleUsersRepository = new RoleUsersRepository(),
    private readonly usersRepository: UsersRepository = new UsersRepository(),
    private readonly rolesRepository: RolesRepository = new RolesRepository()
  ) {}

  // ================== READ ==================
  public async getAll(): Promise<RoleUserResponseDto[]> {
    const assignments = await this.repository.findAllActive();
    return assignments.map((assignment) => toRoleUserResponse(assignment));
  }

  public async getOne(id: number): Promise<RoleUserResponseDto> {
    return toRoleUserResponse(await this.findOrFail(id));
  }

  // ================== CREATE (asignar) ==================
  public async assign(body: CreateRoleUserDto): Promise<RoleUserResponseDto> {
    if (!body.user_id || !body.role_id) {
      throw new AppError(400, "user_id and role_id are required");
    }

    await this.assertUserActive(body.user_id);
    await this.assertRoleActive(body.role_id);

    const existing = await this.repository.findByUserAndRole(body.user_id, body.role_id);
    if (existing) {
      if (existing.status === "active") {
        throw new AppError(409, "Role is already assigned to this user");
      }
      const reactivated = await this.repository.update(existing, { status: "active" });
      return toRoleUserResponse(await this.reload(reactivated.id));
    }

    const created = await this.repository.create({
      user_id: body.user_id,
      role_id: body.role_id,
      status: "active",
    });
    return toRoleUserResponse(await this.reload(created.id));
  }

  // ================== STATE ==================
  public async deactivate(id: number): Promise<RoleUserResponseDto> {
    const assignment = await this.findOrFail(id);
    await this.repository.update(assignment, { status: "inactive" });
    return toRoleUserResponse(await this.reload(assignment.id));
  }

  public async reactivate(id: number): Promise<RoleUserResponseDto> {
    const assignment = await this.findOrFail(id, false);
    if (assignment.status === "active") {
      throw new AppError(409, "Assignment is already active");
    }
    await this.repository.update(assignment, { status: "active" });
    return toRoleUserResponse(await this.reload(assignment.id));
  }

  // ================== HELPERS ==================
  private async findOrFail(id: number, onlyActive = true): Promise<RoleUser> {
    const assignment = await this.repository.findById(id);
    if (!assignment || (onlyActive && assignment.status !== "active")) {
      throw new AppError(404, "Role assignment not found");
    }
    return assignment;
  }

  private async reload(id: number): Promise<RoleUser> {
    const assignment = await this.repository.findById(id);
    if (!assignment) throw new AppError(404, "Role assignment not found");
    return assignment;
  }

  private async assertUserActive(userId: number): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user || user.status !== "active") {
      throw new AppError(404, "User not found or inactive");
    }
  }

  private async assertRoleActive(roleId: number): Promise<void> {
    const role = await this.rolesRepository.findById(roleId);
    if (!role || role.status !== "active") {
      throw new AppError(404, "Role not found or inactive");
    }
  }
}
EOF
```

**`role-users.controller.ts`**

```bash
: > src/features/auth/role-users/role-users.controller.ts
cat >> src/features/auth/role-users/role-users.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CreateRoleUserDto } from "./dto";
import { RoleUsersService } from "./role-users.service";

export class RoleUsersController extends BaseController {
  public constructor(
    private readonly service: RoleUsersService = new RoleUsersService()
  ) {
    super();
  }

  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const assignments = await this.service.getAll();
      res.status(200).json({ assignments });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const assignment = await this.service.getOne(this.paramId(req));
      res.status(200).json({ assignment });
    });
  }

  public async assign(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const assignment = await this.service.assign(req.body as CreateRoleUserDto);
      res.status(201).json({ assignment });
    });
  }

  public async deactivate(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const assignment = await this.service.deactivate(this.paramId(req));
      res.status(200).json({ message: "Role assignment deactivated", assignment });
    });
  }

  public async reactivate(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const assignment = await this.service.reactivate(this.paramId(req));
      res.status(200).json({ message: "Role assignment reactivated", assignment });
    });
  }
}
EOF
```

**`role-users.routes.ts`** (middlewares comentados hasta ISS-13)

```bash
: > src/features/auth/role-users/role-users.routes.ts
cat >> src/features/auth/role-users/role-users.routes.ts << 'EOF'
import { Application } from "express";
import { RoleUsersController } from "./role-users.controller";
// import { authenticate, authorize } from "../access"; // TODO ISS-13

export class RoleUsersRoutes {
  public roleUsersController: RoleUsersController = new RoleUsersController();

  public routes(app: Application): void {
    app
      .route("/api/asignaciones-rol")
      .get(this.roleUsersController.getAll.bind(this.roleUsersController))
      .post(this.roleUsersController.assign.bind(this.roleUsersController));

    app
      .route("/api/asignaciones-rol/:id")
      .get(this.roleUsersController.getOne.bind(this.roleUsersController));

    app
      .route("/api/asignaciones-rol/:id/deactivate")
      .patch(this.roleUsersController.deactivate.bind(this.roleUsersController));

    app
      .route("/api/asignaciones-rol/:id/reactivate")
      .patch(this.roleUsersController.reactivate.bind(this.roleUsersController));
  }
}
EOF
```

---

## 17.3 RoleUsers — seeder y swagger

**`role-users.seeder.ts`**

```bash
: > src/features/auth/role-users/role-users.seeder.ts
cat >> src/features/auth/role-users/role-users.seeder.ts << 'EOF'
import { RoleUser } from "./role-user.model";
import { Role } from "../roles/role.model";
import { User } from "../users/user.model";

export const SEED_ROLE_USERS = [
  { username: "admin", roleName: "ADMIN" },
  { username: "seller", roleName: "SELLER" },
] as const;

export async function seedRoleUsers(): Promise<number> {
  let created = 0;

  for (const item of SEED_ROLE_USERS) {
    const user = await User.findOne({ where: { username: item.username } });
    const role = await Role.findOne({ where: { name: item.roleName } });

    if (!user || !role) {
      console.log(
        `⏭️  role_users: falta ${item.username} o ${item.roleName}, se omite esa asignación`
      );
      continue;
    }

    const [assignment, wasCreated] = await RoleUser.findOrCreate({
      where: { user_id: user.id, role_id: role.id },
      defaults: { user_id: user.id, role_id: role.id, status: "active" },
    });

    if (wasCreated) {
      created++;
      continue;
    }
    if (assignment.status !== "active") {
      await assignment.update({ status: "active" });
    }
  }

  console.log(
    `✅ role_users: asignaciones reconciliadas (${SEED_ROLE_USERS.length}, ${created} nuevas)`
  );
  return created;
}
EOF
```

**`role-users.swagger.ts`**

```bash
: > src/features/auth/role-users/role-users.swagger.ts
cat >> src/features/auth/role-users/role-users.swagger.ts << 'EOF'
import {
  bearerSecurity,
  forbiddenResponse,
  invalidIdResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

export const roleUsersSwagger = {
  tags: [
    {
      name: "Asignaciones usuario-rol",
      description:
        "Asignar / retirar / reactivar el rol de un usuario (`role_users`) — **JWT + RBAC**",
    },
  ],
  paths: {
    "/api/asignaciones-rol": {
      get: {
        tags: ["Asignaciones usuario-rol"],
        summary: "Listar asignaciones activas",
        security: bearerSecurity,
        responses: {
          "200": { description: "Lista de asignaciones (`{ assignments: [...] }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
        },
      },
      post: {
        tags: ["Asignaciones usuario-rol"],
        summary: "Asignar rol a usuario",
        description:
          "Cuerpo: `{ user_id, role_id }`. Idempotente: si la pareja existía desactivada, se reactiva.",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RoleUserCreate" } },
          },
        },
        responses: {
          "201": { description: "Asignación creada (`{ assignment }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": { description: "Usuario o rol inexistente o inactivo" },
          "409": { description: "El rol ya está asignado a ese usuario" },
        },
      },
    },
    "/api/asignaciones-rol/{id}": {
      get: {
        tags: ["Asignaciones usuario-rol"],
        summary: "Obtener asignación por id",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Asignación (`{ assignment }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/asignaciones-rol/{id}/deactivate": {
      patch: {
        tags: ["Asignaciones usuario-rol"],
        summary: "Retirar rol a usuario (borrado lógico)",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Asignación desactivada (`{ message, assignment }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/asignaciones-rol/{id}/reactivate": {
      patch: {
        tags: ["Asignaciones usuario-rol"],
        summary: "Reactivar asignación",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Asignación reactivada (`{ message, assignment }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
          "409": { description: "La asignación ya estaba activa" },
        },
      },
    },
  },
  components: {
    schemas: {
      RoleUser: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          user_id: { type: "integer", example: 1 },
          role_id: { type: "integer", example: 1 },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          user: {
            type: "object",
            properties: {
              id: { type: "integer" },
              username: { type: "string" },
              email: { type: "string", format: "email" },
            },
          },
          role: {
            type: "object",
            properties: { id: { type: "integer" }, name: { type: "string" } },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RoleUserCreate: {
        type: "object",
        required: ["user_id", "role_id"],
        properties: {
          user_id: { type: "integer", example: 2 },
          role_id: { type: "integer", example: 2 },
        },
      },
    },
  },
};
EOF
```

---

## 17.4 DTOs de ResourceRoles

**`dto/create-resource-role.dto.ts`**

```bash
: > src/features/auth/resource-roles/dto/create-resource-role.dto.ts
cat >> src/features/auth/resource-roles/dto/create-resource-role.dto.ts << 'EOF'
export interface CreateResourceRoleDto {
  role_id: number;
  resource_id: number;
}
EOF
```

**`dto/list-resource-roles.dto.ts`**

```bash
: > src/features/auth/resource-roles/dto/list-resource-roles.dto.ts
cat >> src/features/auth/resource-roles/dto/list-resource-roles.dto.ts << 'EOF'
export interface ListResourceRolesDto {
  role_id?: number;
  resource_id?: number;
}
EOF
```

**`dto/resource-role-response.dto.ts`**

```bash
: > src/features/auth/resource-roles/dto/resource-role-response.dto.ts
cat >> src/features/auth/resource-roles/dto/resource-role-response.dto.ts << 'EOF'
import { ResourceRole, ResourceRoleI } from "../resource-role.model";

export interface ResourceRoleResponseDto extends ResourceRoleI {
  role?: { id: number; name: string } | null;
  resource?: {
    id: number;
    method: string;
    path: string;
    description: string | null;
  } | null;
}

export function toResourceRoleResponse(resourceRole: ResourceRole): ResourceRoleResponseDto {
  return resourceRole.toJSON() as ResourceRoleResponseDto;
}

export interface EffectivePermissionDto {
  resource_id: number;
  method: string;
  path: string;
  description: string | null;
  role_id: number;
  role_name: string;
}
EOF
```

**`dto/index.ts`**

```bash
: > src/features/auth/resource-roles/dto/index.ts
cat >> src/features/auth/resource-roles/dto/index.ts << 'EOF'
export * from "./create-resource-role.dto";
export * from "./list-resource-roles.dto";
export * from "./resource-role-response.dto";
EOF
```

---

## 17.5 ResourceRoles — repository, service, controller y rutas

**`resource-roles.repository.ts`**

```bash
: > src/features/auth/resource-roles/resource-roles.repository.ts
cat >> src/features/auth/resource-roles/resource-roles.repository.ts << 'EOF'
import { CreationAttributes, Op, Transaction } from "sequelize";
import { ResourceRole } from "./resource-role.model";
import { Role } from "../roles/role.model";
import { Resource } from "../resources/resource.model";
import { RoleUser } from "../role-users/role-user.model";
import { EffectivePermissionDto } from "./dto";

const SUMMARIES = [
  { model: Role, as: "role", attributes: ["id", "name"] },
  { model: Resource, as: "resource", attributes: ["id", "method", "path", "description"] },
];

export class ResourceRolesRepository {
  public async findAllActive(): Promise<ResourceRole[]> {
    return ResourceRole.findAll({ where: { status: "active" }, include: SUMMARIES });
  }

  public async findAllActiveFiltered(filters: {
    role_id?: number;
    resource_id?: number;
  }): Promise<ResourceRole[]> {
    const where: Record<string, unknown> = { status: "active" };
    if (filters.role_id) where.role_id = filters.role_id;
    if (filters.resource_id) where.resource_id = filters.resource_id;
    return ResourceRole.findAll({ where, include: SUMMARIES, order: [["id", "ASC"]] });
  }

  public async findById(id: number, transaction?: Transaction): Promise<ResourceRole | null> {
    return ResourceRole.findByPk(id, { include: SUMMARIES, transaction });
  }

  public async findByRoleAndResource(roleId: number, resourceId: number): Promise<ResourceRole | null> {
    return ResourceRole.findOne({ where: { role_id: roleId, resource_id: resourceId } });
  }

  public async findAllByRole(roleId: number, transaction?: Transaction): Promise<ResourceRole[]> {
    return ResourceRole.findAll({ where: { role_id: roleId }, transaction });
  }

  public async create(
    data: CreationAttributes<ResourceRole>,
    transaction?: Transaction
  ): Promise<ResourceRole> {
    return ResourceRole.create(data, { transaction });
  }

  public async update(
    resourceRole: ResourceRole,
    data: Partial<ResourceRole>,
    transaction?: Transaction
  ): Promise<ResourceRole> {
    return resourceRole.update(data, { transaction });
  }

  /**
   * CONSULTA DE AUTORIZACIÓN EFECTIVA. Recorre la cadena completa:
   * `resource_roles → roles → role_users → resources`, todos activos.
   */
  public async findEffectiveForUser(userId: number): Promise<EffectivePermissionDto[]> {
    const rows = await ResourceRole.findAll({
      where: { status: "active" },
      attributes: ["id"],
      include: [
        {
          model: Role,
          as: "role",
          required: true,
          attributes: ["id", "name"],
          where: { status: "active" },
          include: [
            {
              model: RoleUser,
              as: "role_users",
              required: true,
              attributes: [],
              where: { status: "active", user_id: userId },
            },
          ],
        },
        {
          model: Resource,
          as: "resource",
          required: true,
          attributes: ["id", "method", "path", "description"],
          where: { status: "active" },
        },
      ],
      order: [["id", "ASC"]],
    });

    return rows.map((row) => {
      const plain = row.toJSON() as unknown as {
        role: { id: number; name: string };
        resource: { id: number; method: string; path: string; description: string | null };
      };
      return {
        resource_id: plain.resource.id,
        method: plain.resource.method,
        path: plain.resource.path,
        description: plain.resource.description,
        role_id: plain.role.id,
        role_name: plain.role.name,
      };
    });
  }

  public async countActiveByRole(roleId: number): Promise<number> {
    return ResourceRole.count({ where: { role_id: roleId, status: "active" } });
  }

  public async countActive(): Promise<number> {
    return ResourceRole.count({ where: { status: "active" } });
  }

  public async countActiveByResources(resourceIds: number[]): Promise<number> {
    if (resourceIds.length === 0) return 0;
    return ResourceRole.count({
      where: { resource_id: { [Op.in]: resourceIds }, status: "active" },
    });
  }
}
EOF
```

**`resource-roles.service.ts`**

```bash
: > src/features/auth/resource-roles/resource-roles.service.ts
cat >> src/features/auth/resource-roles/resource-roles.service.ts << 'EOF'
import {
  CreateResourceRoleDto,
  EffectivePermissionDto,
  ListResourceRolesDto,
  ResourceRoleResponseDto,
  toResourceRoleResponse,
} from "./dto";
import { ResourceRolesRepository } from "./resource-roles.repository";
import { ResourceRole } from "./resource-role.model";
import { RolesRepository } from "../roles/roles.repository";
import { ResourcesRepository } from "../resources/resources.repository";
import { AppError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";

export interface ReconcileResult {
  role_id: number;
  activated: number;
  deactivated: number;
  total_active: number;
}

export class ResourceRolesService {
  public constructor(
    private readonly repository: ResourceRolesRepository = new ResourceRolesRepository(),
    private readonly rolesRepository: RolesRepository = new RolesRepository(),
    private readonly resourcesRepository: ResourcesRepository = new ResourcesRepository()
  ) {}

  // ================== READ ==================
  public async getAll(filters: ListResourceRolesDto = {}): Promise<ResourceRoleResponseDto[]> {
    const grants = await this.repository.findAllActiveFiltered({
      role_id: filters.role_id,
      resource_id: filters.resource_id,
    });
    return grants.map((grant) => toResourceRoleResponse(grant));
  }

  public async getOne(id: number): Promise<ResourceRoleResponseDto> {
    return toResourceRoleResponse(await this.findOrFail(id));
  }

  public async findEffectiveForUser(userId: number): Promise<EffectivePermissionDto[]> {
    return this.repository.findEffectiveForUser(userId);
  }

  // ================== CREATE (conceder) ==================
  public async grant(body: CreateResourceRoleDto): Promise<ResourceRoleResponseDto> {
    if (!body.role_id || !body.resource_id) {
      throw new AppError(400, "role_id and resource_id are required");
    }

    const role = await this.rolesRepository.findById(body.role_id);
    if (!role || role.status !== "active") {
      throw new AppError(404, "Role not found or inactive");
    }
    const resource = await this.resourcesRepository.findById(body.resource_id);
    if (!resource || resource.status !== "active") {
      throw new AppError(404, "Resource not found or inactive");
    }

    const existing = await this.repository.findByRoleAndResource(body.role_id, body.resource_id);
    if (existing) {
      if (existing.status === "active") {
        throw new AppError(409, "Role already has this resource granted");
      }
      const reactivated = await this.repository.update(existing, { status: "active" });
      return toResourceRoleResponse(await this.reload(reactivated.id));
    }

    const created = await this.repository.create({
      role_id: body.role_id,
      resource_id: body.resource_id,
      status: "active",
    });
    return toResourceRoleResponse(await this.reload(created.id));
  }

  // ================== STATE ==================
  public async deactivate(id: number): Promise<ResourceRoleResponseDto> {
    const grant = await this.findOrFail(id);
    await this.repository.update(grant, { status: "inactive" });
    return toResourceRoleResponse(await this.reload(grant.id));
  }

  public async reactivate(id: number): Promise<ResourceRoleResponseDto> {
    const grant = await this.findOrFail(id, false);
    if (grant.status === "active") {
      throw new AppError(409, "Grant is already active");
    }
    await this.repository.update(grant, { status: "active" });
    return toResourceRoleResponse(await this.reload(grant.id));
  }

  // ================== RECONCILIACIÓN ==================
  public async reconcileRole(roleId: number, resourceIds: number[]): Promise<ReconcileResult> {
    const role = await this.rolesRepository.findById(roleId);
    if (!role) throw new AppError(404, "Role not found");

    const wanted = new Set(resourceIds);

    return withTransaction(async (t) => {
      const existing = await this.repository.findAllByRole(roleId, t);
      const byResource = new Map(existing.map((row) => [row.resource_id, row]));

      let activated = 0;
      let deactivated = 0;

      for (const resourceId of wanted) {
        const row = byResource.get(resourceId);
        if (!row) {
          await this.repository.create(
            { role_id: roleId, resource_id: resourceId, status: "active" },
            t
          );
          activated++;
          continue;
        }
        if (row.status !== "active") {
          await this.repository.update(row, { status: "active" }, t);
          activated++;
        }
      }

      for (const row of existing) {
        if (wanted.has(row.resource_id)) continue;
        if (row.status === "active") {
          await this.repository.update(row, { status: "inactive" }, t);
          deactivated++;
        }
      }

      return {
        role_id: roleId,
        activated,
        deactivated,
        total_active: wanted.size,
      };
    });
  }

  // ================== HELPERS ==================
  private async findOrFail(id: number, onlyActive = true): Promise<ResourceRole> {
    const grant = await this.repository.findById(id);
    if (!grant || (onlyActive && grant.status !== "active")) {
      throw new AppError(404, "Grant not found");
    }
    return grant;
  }

  private async reload(id: number): Promise<ResourceRole> {
    const grant = await this.repository.findById(id);
    if (!grant) throw new AppError(404, "Grant not found");
    return grant;
  }
}
EOF
```

**`resource-roles.controller.ts`**

```bash
: > src/features/auth/resource-roles/resource-roles.controller.ts
cat >> src/features/auth/resource-roles/resource-roles.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CreateResourceRoleDto } from "./dto";
import { ResourceRolesService } from "./resource-roles.service";

export class ResourceRolesController extends BaseController {
  public constructor(
    private readonly service: ResourceRolesService = new ResourceRolesService()
  ) {
    super();
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const grants = await this.service.getAll({
        role_id: toOptionalNumber(req.query.role_id),
        resource_id: toOptionalNumber(req.query.resource_id),
      });
      res.status(200).json({ grants });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const grant = await this.service.getOne(this.paramId(req));
      res.status(200).json({ grant });
    });
  }

  public async grant(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const grant = await this.service.grant(req.body as CreateResourceRoleDto);
      res.status(201).json({ message: "Resource granted to role", grant });
    });
  }

  public async deactivate(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const grant = await this.service.deactivate(this.paramId(req));
      res.status(200).json({ message: "Grant deactivated (permission revoked)", grant });
    });
  }

  public async reactivate(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const grant = await this.service.reactivate(this.paramId(req));
      res.status(200).json({ message: "Grant reactivated", grant });
    });
  }
}

function toOptionalNumber(value: unknown): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return undefined;
  return Number(raw);
}
EOF
```

**`resource-roles.routes.ts`** (middlewares comentados hasta ISS-13)

```bash
: > src/features/auth/resource-roles/resource-roles.routes.ts
cat >> src/features/auth/resource-roles/resource-roles.routes.ts << 'EOF'
import { Application } from "express";
import { ResourceRolesController } from "./resource-roles.controller";
// import { authenticate, authorize } from "../access"; // TODO ISS-13

export class ResourceRolesRoutes {
  public resourceRolesController: ResourceRolesController = new ResourceRolesController();

  public routes(app: Application): void {
    app
      .route("/api/concesiones-rol")
      .get(this.resourceRolesController.getAll.bind(this.resourceRolesController))
      .post(this.resourceRolesController.grant.bind(this.resourceRolesController));

    app
      .route("/api/concesiones-rol/:id")
      .get(this.resourceRolesController.getOne.bind(this.resourceRolesController));

    app
      .route("/api/concesiones-