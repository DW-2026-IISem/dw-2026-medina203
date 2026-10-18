# 🛠 ISS-06 · Feature ProductType — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase I:** Business (sin auth ni roles).
**Feature / tabla:** `product_types` → `product-types/`
**API:** `/api/tipos-producto` — **SIN AUTH**
**Bloqueado por:** ISS-05 — Swagger / OpenAPI.
**Habilita:** ISS-07 — Feature Product.
**Patrón:** mismo que Client (ISS-03-A…E + 04 + 05).

**Objetivo:** CRUD + seeder + swagger de ProductType (sin FK).

---

## Criterios de aceptación (ISS-06)

- [ ] 11.1 Modelo `product-type.model.ts` (status + timestamps: true)
- [ ] 11.2 DTOs (`dto/`) + Repository + Service + Controller + routes en este orden: getAll, getOne, create, update PUT/PATCH, delete físico y lógico
- [ ] 11.3 Carpeta `http/` en el mismo orden: get, create, update, delete
- [ ] 11.4 Cableado en `routes/index.ts` + `config` (import model + route)
- [ ] 11.5 Seeder + registro en `SeedersRunner` / `counts`
- [ ] 11.6 Swagger + registro en `src/swagger`

```bash
mkdir -p src/features/business/product-types/http
```

---

## 11.1 Modelo ProductType

Crea el modelo con `status`, `timestamps: true` y sin hooks (no hay campos sensibles).

```bash
: > src/features/business/product-types/product-type.model.ts
cat >> src/features/business/product-types/product-type.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface ProductTypeI {
  id?: number;
  name: string;
  description?: string | null;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductType extends Model {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductType.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      // Fail-safe: una fila insertada sin estado explícito NO queda visible en la API.
      // La vía de creación de la API siempre envía "active".
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ProductType",
    tableName: "product_types",
    timestamps: true,
  }
);
EOF
```

---

## 11.2 DTO + Repository + Service + Controller + routes (CRUD completo)

Flujo por capas: `HTTP (routes) → Controller → Service → Repository → Model → Sequelize → BD`.

### DTOs — carpeta `dto/`

```bash
mkdir -p src/features/business/product-types/dto
```

**`dto/create-product-type.dto.ts`**

```bash
# : > src/features/business/product-types/dto/create-product-type.dto.ts
# cat >> src/features/business/product-types/dto/create-product-type.dto.ts << 'EOF'
# /** Datos de entrada de `POST /api/tipos-producto`. */
# export interface CreateProductTypeDto {
#   name: string;
#   description?: string | null;
#   /** Opcional: por defecto `active`. Tras crearlo, el estado sólo cambia con el borrado lógico. */
#   status?: "active" | "inactive";
# }
# EOF
```

**`dto/update-product-type.dto.ts`**

```bash
: > src/features/business/product-types/dto/update-product-type.dto.ts
cat >> src/features/business/product-types/dto/update-product-type.dto.ts << 'EOF'
/**
 * Datos de entrada de `PUT /api/tipos-producto/:id` (reemplazo completo).
 *
 * `status` **no** está aquí a propósito: el estado sólo cambia con el borrado
 * lógico (`PATCH /api/tipos-producto/:id/deactivate`).
 */
export interface UpdateProductTypeDto {
  name: string;
  description?: string | null;
}
EOF
```

**`dto/patch-product-type.dto.ts`**

```bash
: > src/features/business/product-types/dto/patch-product-type.dto.ts
cat >> src/features/business/product-types/dto/patch-product-type.dto.ts << 'EOF'
import { UpdateProductTypeDto } from "./update-product-type.dto";

/** Datos de entrada de `PATCH /api/tipos-producto/:id` (actualización parcial). */
export type PatchProductTypeDto = Partial<UpdateProductTypeDto>;
EOF
```

**`dto/product-type-response.dto.ts`**

```bash
: > src/features/business/product-types/dto/product-type-response.dto.ts
cat >> src/features/business/product-types/dto/product-type-response.dto.ts << 'EOF'
import { ProductType, ProductTypeI } from "../product-type.model";

/**
 * Respuesta HTTP de un tipo de producto.
 *
 * Regla del DTO de respuesta: la API expone **sólo** lo que declara este tipo.
 * `ProductType` no guarda campos internos, por eso el contrato coincide hoy con
 * el modelo. Si mañana aparece uno, la proyección se vuelve explícita aquí
 * (`Omit<ProductTypeI, "...">`) y el mapper lo omite.
 */
export type ProductTypeResponseDto = ProductTypeI;

/** Mapper modelo -> DTO de respuesta (objeto plano, sin métodos de Sequelize). */
export function toProductTypeResponse(productType: ProductType): ProductTypeResponseDto {
  return productType.toJSON() as ProductTypeResponseDto;
}
EOF
```

**`dto/index.ts`**

```bash
: > src/features/business/product-types/dto/index.ts
cat >> src/features/business/product-types/dto/index.ts << 'EOF'
export * from "./create-product-type.dto";
export * from "./update-product-type.dto";
export * from "./patch-product-type.dto";
export * from "./product-type-response.dto";
EOF
```

### Repository

Única capa que habla con el modelo `ProductType`.

```bash
: > src/features/business/product-types/product-types.repository.ts
cat >> src/features/business/product-types/product-types.repository.ts << 'EOF'
import { CreationAttributes } from "sequelize";
import { ProductType, ProductTypeI } from "./product-type.model";

/**
 * Capa Repository del feature ProductTypes.
 *
 * Única responsable de hablar con Sequelize (el modelo `ProductType`).
 */
export class ProductTypesRepository {
  /** Todos los tipos activos. */
  public async findAllActive(): Promise<ProductType[]> {
    return ProductType.findAll({ where: { status: "active" } });
  }

  /** Un tipo por PK (o `null`). */
  public async findById(id: number): Promise<ProductType | null> {
    return ProductType.findByPk(id);
  }

  /** Inserta un tipo de producto. */
  public async create(data: CreationAttributes<ProductType>): Promise<ProductType> {
    return ProductType.create(data);
  }

  /** Persiste cambios sobre una instancia existente. */
  public async update(
    productType: ProductType,
    data: Partial<ProductTypeI>
  ): Promise<ProductType> {
    return productType.update(data);
  }

  /** Elimina físicamente una instancia. */
  public async delete(productType: ProductType): Promise<void> {
    await productType.destroy();
  }
}
EOF
```

### Service

Reglas de negocio: default de `status`, política de borrado lógico, borrado físico.

```bash
: > src/features/business/product-types/product-types.service.ts
cat >> src/features/business/product-types/product-types.service.ts << 'EOF'
import {
  CreateProductTypeDto,
  PatchProductTypeDto,
  ProductTypeResponseDto,
  UpdateProductTypeDto,
  toProductTypeResponse,
} from "./dto";
import { ProductTypesRepository } from "./product-types.repository";
import { ProductType } from "./product-type.model";
import { AppError } from "../../../shared/errors/app-error";

/**
 * Capa Service del feature ProductTypes.
 *
 * Reglas de negocio: default de `status`, política de borrado lógico y borrado
 * físico. No conoce `req`/`res` ni escribe Sequelize: delega en el repository y
 * devuelve **DTOs** (carpeta `dto/`).
 */
export class ProductTypesService {
  public constructor(
    private readonly repository: ProductTypesRepository = new ProductTypesRepository()
  ) {}

  // ================== READ ==================
  public async getAll(): Promise<ProductTypeResponseDto[]> {
    const productTypes = await this.repository.findAllActive();
    return productTypes.map((productType) => toProductTypeResponse(productType));
  }

  public async getOne(id: number): Promise<ProductTypeResponseDto> {
    return toProductTypeResponse(await this.findOrFail(id));
  }

  // ================== CREATE ==================
  public async create(body: CreateProductTypeDto): Promise<ProductTypeResponseDto> {
    // Copia campo a campo a propósito (evita *mass assignment*).
    const productType = await this.repository.create({
      name: body.name,
      description: body.description ?? null,
      status: body.status ?? "active",
    });
    return toProductTypeResponse(productType);
  }

  // ================== UPDATE ==================
  public async updatePut(
    id: number,
    body: UpdateProductTypeDto
  ): Promise<ProductTypeResponseDto> {
    const productType = await this.findOrFail(id);

    await this.repository.update(productType, {
      name: body.name,
      description: body.description ?? null,
    });
    return toProductTypeResponse(productType);
  }

  public async updatePatch(
    id: number,
    body: PatchProductTypeDto
  ): Promise<ProductTypeResponseDto> {
    const productType = await this.findOrFail(id);

    await this.repository.update(productType, body);
    return toProductTypeResponse(productType);
  }

  // ================== DELETE ==================
  /** Eliminación física. */
  public async deletePhysical(id: number): Promise<void> {
    const productType = await this.findOrFail(id, false);
    await this.repository.delete(productType);
  }

  /** Eliminación lógica -> `status = inactive`. */
  public async deleteLogical(id: number): Promise<ProductTypeResponseDto> {
    const productType = await this.findOrFail(id);

    await this.repository.update(productType, { status: "inactive" });
    return toProductTypeResponse(productType);
  }

  // ================== HELPERS ==================
  /**
   * Busca por PK y falla con 404 si no existe.
   *
   * `onlyActive` (por defecto `true`) aplica la política de borrado lógico.
   */
  private async findOrFail(id: number, onlyActive = true): Promise<ProductType> {
    const productType = await this.repository.findById(id);
    if (!productType || (onlyActive && productType.status !== "active")) {
      throw new AppError(404, "Product type not found");
    }
    return productType;
  }
}
EOF
```

### Controller

Solo HTTP: lee `req`, llama al service, arma `res`.

```bash
: > src/features/business/product-types/product-types.controller.ts
cat >> src/features/business/product-types/product-types.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import {
  CreateProductTypeDto,
  PatchProductTypeDto,
  UpdateProductTypeDto,
} from "./dto";
import { ProductTypesService } from "./product-types.service";

/**
 * Capa Controller del feature ProductTypes.
 * Solo HTTP: lee `req`, llama al service y arma la respuesta.
 * El manejo de errores se delega en `run()` (ver `BaseController`).
 */
export class ProductTypesController extends BaseController {
  public constructor(
    private readonly service: ProductTypesService = new ProductTypesService()
  ) {
    super();
  }

  // ================== READ ==================
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_types = await this.service.getAll();
      res.status(200).json({ product_types });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_type = await this.service.getOne(this.paramId(req));
      res.status(200).json({ product_type });
    });
  }

  // ================== CREATE ==================
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_type = await this.service.create(
        req.body as CreateProductTypeDto
      );
      res.status(201).json({ product_type });
    });
  }

  // ================== UPDATE ==================
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_type = await this.service.updatePut(
        this.paramId(req),
        req.body as UpdateProductTypeDto
      );
      res.status(200).json({ product_type });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_type = await this.service.updatePatch(
        this.paramId(req),
        req.body as PatchProductTypeDto
      );
      res.status(200).json({ product_type });
    });
  }

  // ================== DELETE ==================
  /** Eliminación física. */
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Product type permanently deleted", id });
    });
  }

  /** Eliminación lógica -> `status = inactive`. */
  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_type = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({
        message: "Product type deactivated (logical delete)",
        product_type,
      });
    });
  }
}
EOF
```

### Routes

```bash
: > src/features/business/product-types/product-types.routes.ts
cat >> src/features/business/product-types/product-types.routes.ts << 'EOF'
import { Application } from "express";
import { ProductTypesController } from "./product-types.controller";

export class ProductTypesRoutes {
  public productTypesController: ProductTypesController = new ProductTypesController();

  public routes(app: Application): void {
    // ================== RUTAS SIN AUTENTICACIÓN / SIN MIDDLEWARE JWT ==================

    // getAll
    app
      .route("/api/tipos-producto")
      .get(this.productTypesController.getAll.bind(this.productTypesController));

    // getOne
    app
      .route("/api/tipos-producto/:id")
      .get(this.productTypesController.getOne.bind(this.productTypesController));

    // create
    app
      .route("/api/tipos-producto")
      .post(this.productTypesController.create.bind(this.productTypesController));

    // update (PUT / PATCH)
    app
      .route("/api/tipos-producto/:id")
      .put(this.productTypesController.updatePut.bind(this.productTypesController))
      .patch(this.productTypesController.updatePatch.bind(this.productTypesController));

    // delete físico
    app
      .route("/api/tipos-producto/:id")
      .delete(this.productTypesController.deletePhysical.bind(this.productTypesController));

    // delete lógico
    app
      .route("/api/tipos-producto/:id/deactivate")
      .patch(this.productTypesController.deleteLogical.bind(this.productTypesController));
  }
}
EOF
```

---

## 11.3 HTTP (REST Client) — SIN AUTH

Crea los 4 archivos `.http` **sin Authorization** (Fase I).

```bash
: > src/features/business/product-types/http/product-types.get.http
cat >> src/features/business/product-types/http/product-types.get.http << 'EOF'
### Feature ProductType — GET ALL / GET ONE (SIN AUTH)
@baseUrl = http://localhost:3000
@id = 1

### GET ALL
GET {{baseUrl}}/api/tipos-producto

### GET ONE
GET {{baseUrl}}/api/tipos-producto/{{id}}
EOF

: > src/features/business/product-types/http/product-types.create.http
cat >> src/features/business/product-types/http/product-types.create.http << 'EOF'
### Feature ProductType — CREATE (SIN AUTH)
@baseUrl = http://localhost:3000

### CREATE
POST {{baseUrl}}/api/tipos-producto
Content-Type: application/json

{
  "name": "Electrónica",
  "description": "Dispositivos y accesorios",
  "status": "active"
}
EOF

: > src/features/business/product-types/http/product-types.update.http
cat >> src/features/business/product-types/http/product-types.update.http << 'EOF'
### Feature ProductType — UPDATE (PUT) / UPDATE (PATCH) (SIN AUTH)
@baseUrl = http://localhost:3000
@id = 1

### PUT
PUT {{baseUrl}}/api/tipos-producto/{{id}}
Content-Type: application/json

{
  "name": "Electrónica Actualizada",
  "description": "Categoría renovada"
}

### PATCH
PATCH {{baseUrl}}/api/tipos-producto/{{id}}
Content-Type: application/json

{
  "description": "Descripción parcial"
}
EOF

: > src/features/business/product-types/http/product-types.delete.http
cat >> src/features/business/product-types/http/product-types.delete.http << 'EOF'
### Feature ProductType — DELETE físico / DELETE lógico (SIN AUTH)
@baseUrl = http://localhost:3000
@id = 1

### DELETE físico
DELETE {{baseUrl}}/api/tipos-producto/{{id}}

### DELETE lógico
PATCH {{baseUrl}}/api/tipos-producto/{{id}}/deactivate
EOF
```

---

## 11.4 Cableado Routes + Config

**PARCHE — `src/routes/index.ts`**

Abre:

```bash
code src/routes/index.ts
```

Debajo de `import { ClientsRoutes } ...`, añadir:

```typescript
import { ProductTypesRoutes } from "../features/business/product-types/product-types.routes";
```

Dentro de `export class Routes`, debajo de `clientsRoutes`, añadir:

```typescript
  public productTypesRoutes: ProductTypesRoutes = new ProductTypesRoutes();
```

**PARCHE — `src/config/index.ts`**

Abre:

```bash
code src/config/index.ts
```

Debajo de `import "../features/business/clients/client.model";`, añadir:

```typescript
import "../features/business/product-types/product-type.model";
```

Dentro de `routes()`, debajo de `this.routePrv.clientsRoutes.routes(this.app);`, añadir:

```typescript
    this.routePrv.productTypesRoutes.routes(this.app);
```

### Verificación

Con el servidor corriendo:

```bash
curl -s -X POST http://localhost:3000/api/tipos-producto -H 'Content-Type: application/json' \
  -d '{"name":"Bebidas","description":"Refrescos","status":"active"}'
curl -s http://localhost:3000/api/tipos-producto
```

---

## 11.5 Seeder ProductType

```bash
: > src/features/business/product-types/product-types.seeder.ts
cat >> src/features/business/product-types/product-types.seeder.ts << 'EOF'
import { faker } from "@faker-js/faker";
import { ProductType } from "./product-type.model";

/**
 * Seeder del feature ProductType (datos falsos con @faker-js/faker).
 * Se invoca desde `src/database/seeders` (SeedersRunner), no desde la App.
 *
 * Idempotente: si ya hay filas, no vuelve a insertar.
 */
export async function seedProductTypes(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️  product_types: count=0, se omite");
    return 0;
  }

  const existing = await ProductType.count();
  if (existing > 0) {
    console.log(`⏭️  product_types: ya hay ${existing} registro(s), se omite seeder`);
    return 0;
  }

  const rows = Array.from({ length: count }, () => ({
    name: faker.commerce.department(),
    description: faker.commerce.productDescription(),
    status: "active" as const,
  }));

  await ProductType.bulkCreate(rows);
  console.log(`✅ product_types: insertados ${count} registro(s) falsos`);
  return count;
}
EOF
```

**PARCHE — `src/database/seeders/counts.ts`**

Dentro de `SeedCounts`, añadir:

```typescript
  product_types: number;
```

Dentro de `DEFAULT_SEED_COUNTS`, añadir:

```typescript
  product_types: 25,
```

Dentro de la resolución por env (`resolveSeedCounts`), añadir:

```typescript
  const envProductTypes = process.env.SEED_PRODUCT_TYPES;
  if (envProductTypes !== undefined && envProductTypes !== "") {
    counts.product_types = Number(envProductTypes);
  }
```

**PARCHE — `src/database/seeders/index.ts`**

Debajo de los imports de client, añadir:

```typescript
import "../../features/business/product-types/product-type.model";
import { seedProductTypes } from "../../features/business/product-types/product-types.seeder";
```

Debajo de `await seedClients(counts.clients);`, añadir:

```typescript
  await seedProductTypes(counts.product_types);
```

---

## 11.6 Swagger ProductType — SIN AUTH

> **NOTA:** el material original importa `swagger-security` (bearerSecurity, etc.).
> En Fase I **no existe ese archivo**. La versión de abajo está adaptada a **SIN AUTH**.

```bash
: > src/features/business/product-types/product-types.swagger.ts
cat >> src/features/business/product-types/product-types.swagger.ts << 'EOF'
/**
 * Documentación OpenAPI del feature ProductType.
 * Se agrega desde `src/swagger` (registry externo), no se monta aquí.
 * Leyenda: Fase I Business — **SIN AUTH**.
 */

export const productTypesSwagger = {
  tags: [
    {
      name: "TiposProducto",
      description: "CRUD de tipos de producto — **SIN AUTH** (Fase I Business)",
    },
  ],
  paths: {
    "/api/tipos-producto": {
      get: {
        tags: ["TiposProducto"],
        summary: "Listar tipos de producto activos",
        description: "Retorna tipos con status=active",
        responses: {
          "200": {
            description: "Lista de tipos de producto",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    product_types: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ProductType" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["TiposProducto"],
        summary: "Crear tipo de producto",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductTypeCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "Tipo de producto creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    product_type: { $ref: "#/components/schemas/ProductType" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/tipos-producto/{id}": {
      get: {
        tags: ["TiposProducto"],
        summary: "Obtener tipo de producto por id",
        description: "404 si no existe o tiene borrado lógico",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "id numérico (> 0).",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": {
            description: "Tipo de producto encontrado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    product_type: { $ref: "#/components/schemas/ProductType" },
                  },
                },
              },
            },
          },
          "400": { description: "id inválido (debe ser un entero positivo)" },
          "404": { description: "No encontrado" },
        },
      },
      put: {
        tags: ["TiposProducto"],
        summary: "Actualizar tipo de producto (PUT — reemplazo)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "id numérico (> 0).",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductTypeUpdate" },
            },
          },
        },
        responses: {
          "200": { description: "Actualizado" },
          "400": { description: "id inválido (debe ser un entero positivo)" },
          "404": { description: "No encontrado" },
        },
      },
      patch: {
        tags: ["TiposProducto"],
        summary: "Actualizar tipo de producto (PATCH — parcial)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "id numérico (> 0).",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductTypePatch" },
            },
          },
        },
        responses: {
          "200": { description: "Actualizado" },
          "400": { description: "id inválido (debe ser un entero positivo)" },
          "404": { description: "No encontrado" },
        },
      },
      delete: {
        tags: ["TiposProducto"],
        summary: "Eliminar tipo de producto (físico)",
        description: "Borra la fila (también si tiene borrado lógico)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "id numérico (> 0).",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": { description: "Eliminado" },
          "400": { description: "id inválido (debe ser un entero positivo)" },
          "404": { description: "No encontrado" },
        },
      },
    },
    "/api/tipos-producto/{id}/deactivate": {
      patch: {
        tags: ["TiposProducto"],
        summary: "Eliminar tipo de producto (lógico)",
        description: "status = inactive",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "id numérico (> 0).",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": { description: "Desactivado" },
          "400": { description: "id inválido (debe ser un entero positivo)" },
          "404": { description: "No encontrado" },
        },
      },
    },
  },
  components: {
    schemas: {
      ProductType: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Electrónica" },
          description: { type: "string", example: "Dispositivos y accesorios", nullable: true },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductTypeCreate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      ProductTypeUpdate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
      },
      ProductTypePatch: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
      },
    },
  },
};
EOF
```

**PARCHE — `src/swagger/index.ts`**

Abre:

```bash
code src/swagger/index.ts
```

Debajo de `import { clientsSwagger } ...`, añadir:

```typescript
import { productTypesSwagger } from "../features/business/product-types/product-types.swagger";
```

Dentro de `featureSwaggerModules`, debajo de `clientsSwagger,`, añadir:

```typescript
  productTypesSwagger,
```

---

## Verificación final del ISS-06

```bash
# 1. Compilación sin errores
npx tsc --noEmit

# 2. Arranca el servidor
npm run dev
```

En **otra terminal**:

```bash
# 3. Crear y listar
curl -s -X POST http://localhost:3000/api/tipos-producto \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bebidas","description":"Refrescos","status":"active"}'

curl -s http://localhost:3000/api/tipos-producto

# 4. Correr el seeder
npm run db:seed

# 5. Verificar Swagger
curl -s http://localhost:3000/api/docs.json | head -c 200
```

Y abre en el navegador:

```
http://localhost:3000/api/docs
```

Debes ver **dos tags**: `Clientes` y `TiposProducto`.

---

## Cierre del ISS-06

```bash
npm run dev
```

El servidor debe arrancar sin error. Detenerlo con `Ctrl+C` antes de continuar.

### Commit recomendado

```bash
git add .
git commit -m "ISS-06: Feature ProductType (CRUD por capas + seeder + swagger)"
```

---

## ✅ GATE de la unidad ISS-06

Las condiciones de cierre son exactamente las que define el ISS técnico de esta misma página:

- 📋 Criterios de aceptación → **Criterios de aceptación**
- 🧩 Cierre de la unidad → **Cierre del ISS**
- 🧠 Autoevaluación → Evaluación del cuaderno

Con el GATE en verde queda habilitado **ISS-07 · Feature Product**.

---

**Navegación de la ruta:** ← ISS-06 · 🧠 Aprender · ↑ Ruta Express · → ISS-07 · 🧠 Aprender