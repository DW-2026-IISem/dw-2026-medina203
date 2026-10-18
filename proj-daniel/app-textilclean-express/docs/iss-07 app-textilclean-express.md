# 🛠 ISS-07 · Feature Product — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase I:** Business (sin auth ni roles).
**Feature / tabla:** `products` → `products/`
**API:** `/api/productos` — **SIN AUTH**
**Bloqueado por:** ISS-06 — Feature ProductType.
**Habilita:** ISS-08 — Feature Sale + ProductSale.

**Objetivo:** CRUD de Product con FK `product_type_id` + relación `Product ↔ ProductType` + seeder + swagger.

---

## Criterios de aceptación (ISS-07)

- [ ] 12.1 Modelo Product con `product_type_id`
- [ ] 12.2 DTOs (`dto/`) + service que valida tipo activo en `create`/`updatePut` (usando `ProductTypesRepository`)
- [ ] 12.3 Routes + `http/` en orden: getAll, getOne, create, update PUT/PATCH, delete físico y lógico
- [ ] 12.4 Cableado routes/config
- [ ] 12.5 Relaciones `Product ↔ ProductType` (archivo associations + import)
- [ ] 12.6 Seeder + swagger

```bash
mkdir -p src/features/business/products/http
```

---

## 12.1 Modelo Product

```bash
: > src/features/business/products/product.model.ts
cat >> src/features/business/products/product.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface ProductI {
  id?: number;
  name: string;
  brand: string;
  price: number;
  min_stock: number;
  quantity: number;
  product_type_id: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product extends Model {
  public id!: number;
  public name!: string;
  public brand!: string;
  public price!: number;
  public min_stock!: number;
  public quantity!: number;
  public product_type_id!: number;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    min_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    product_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    modelName: "Product",
    tableName: "products",
    timestamps: true,
  }
);
EOF
```

---

## 12.2 DTO + Repository + Service + Controller + routes

### DTOs — carpeta `dto/`

```bash
mkdir -p src/features/business/products/dto
```

**`dto/create-product.dto.ts`**

```bash
: > src/features/business/products/dto/create-product.dto.ts
cat >> src/features/business/products/dto/create-product.dto.ts << 'EOF'
/** Datos de entrada de `POST /api/productos`. */
export interface CreateProductDto {
  name: string;
  brand: string;
  price: number;
  min_stock: number;
  quantity: number;
  product_type_id: number;
  /** Opcional: por defecto `active`. Tras crearlo, el estado sólo cambia con el borrado lógico. */
  status?: "active" | "inactive";
}
EOF
```

**`dto/update-product.dto.ts`**

```bash
: > src/features/business/products/dto/update-product.dto.ts
cat >> src/features/business/products/dto/update-product.dto.ts << 'EOF'
/**
 * Datos de entrada de `PUT /api/productos/:id` (reemplazo completo).
 *
 * `status` **no** está aquí a propósito: el estado sólo cambia con el borrado
 * lógico (`PATCH /api/productos/:id/deactivate`).
 */
export interface UpdateProductDto {
  name: string;
  brand: string;
  price: number;
  min_stock: number;
  quantity: number;
  product_type_id: number;
}
EOF
```

**`dto/patch-product.dto.ts`**

```bash
: > src/features/business/products/dto/patch-product.dto.ts
cat >> src/features/business/products/dto/patch-product.dto.ts << 'EOF'
import { UpdateProductDto } from "./update-product.dto";

/** Datos de entrada de `PATCH /api/productos/:id` (actualización parcial). */
export type PatchProductDto = Partial<UpdateProductDto>;
EOF
```

**`dto/product-response.dto.ts`**

```bash
: > src/features/business/products/dto/product-response.dto.ts
cat >> src/features/business/products/dto/product-response.dto.ts << 'EOF'
import { Product, ProductI } from "../product.model";

/**
 * Respuesta HTTP de un producto.
 *
 * Regla del DTO de respuesta: la API expone **sólo** lo que declara este tipo.
 */
export type ProductResponseDto = ProductI;

/** Mapper modelo -> DTO de respuesta (objeto plano, sin métodos de Sequelize). */
export function toProductResponse(product: Product): ProductResponseDto {
  return product.toJSON() as ProductResponseDto;
}
EOF
```

**`dto/index.ts`**

```bash
: > src/features/business/products/dto/index.ts
cat >> src/features/business/products/dto/index.ts << 'EOF'
export * from "./create-product.dto";
export * from "./update-product.dto";
export * from "./patch-product.dto";
export * from "./product-response.dto";
EOF
```

### Repository

```bash
: > src/features/business/products/products.repository.ts
cat >> src/features/business/products/products.repository.ts << 'EOF'
import { CreationAttributes, Transaction } from "sequelize";
import { Product, ProductI } from "./product.model";

/**
 * Capa Repository del feature Products.
 *
 * Única responsable de hablar con Sequelize (el modelo `Product`).
 * Expone variantes con `transaction`/`lock` que usan los flujos de ventas.
 */
export class ProductsRepository {
  /** Todos los productos activos. */
  public async findAllActive(): Promise<Product[]> {
    return Product.findAll({ where: { status: "active" } });
  }

  /** Un producto por PK (o `null`). */
  public async findById(id: number, transaction?: Transaction): Promise<Product | null> {
    return Product.findByPk(id, { transaction });
  }

  /** Un producto por PK bloqueando la fila (`SELECT ... FOR UPDATE`). */
  public async findByIdForUpdate(
    id: number,
    transaction: Transaction
  ): Promise<Product | null> {
    return Product.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  }

  /** Inserta un producto. */
  public async create(data: CreationAttributes<Product>): Promise<Product> {
    return Product.create(data);
  }

  /** Persiste cambios sobre una instancia existente. */
  public async update(
    product: Product,
    data: Partial<ProductI>,
    transaction?: Transaction
  ): Promise<Product> {
    return product.update(data, { transaction });
  }

  /** Elimina físicamente una instancia. */
  public async delete(product: Product): Promise<void> {
    await product.destroy();
  }
}
EOF
```

### Service

`ProductsService` inyecta **dos repositories**: el propio `ProductsRepository` y el `ProductTypesRepository` de otro feature.

```bash
: > src/features/business/products/products.service.ts
cat >> src/features/business/products/products.service.ts << 'EOF'
import {
  CreateProductDto,
  PatchProductDto,
  ProductResponseDto,
  UpdateProductDto,
  toProductResponse,
} from "./dto";
import { ProductsRepository } from "./products.repository";
import { ProductTypesRepository } from "../product-types/product-types.repository";
import { Product } from "./product.model";
import { AppError } from "../../../shared/errors/app-error";

/**
 * Capa Service del feature Products.
 *
 * Reglas de negocio: default de `status`, política de borrado lógico y
 * validación de que el tipo de producto referenciado exista y esté activo.
 */
export class ProductsService {
  public constructor(
    private readonly repository: ProductsRepository = new ProductsRepository(),
    private readonly productTypesRepository: ProductTypesRepository = new ProductTypesRepository()
  ) {}

  // ================== READ ==================
  public async getAll(): Promise<ProductResponseDto[]> {
    const products = await this.repository.findAllActive();
    return products.map((product) => toProductResponse(product));
  }

  public async getOne(id: number): Promise<ProductResponseDto> {
    return toProductResponse(await this.findOrFail(id));
  }

  // ================== CREATE ==================
  public async create(body: CreateProductDto): Promise<ProductResponseDto> {
    await this.assertActiveProductType(body.product_type_id);

    const product = await this.repository.create({
      name: body.name,
      brand: body.brand,
      price: body.price,
      min_stock: body.min_stock,
      quantity: body.quantity,
      product_type_id: body.product_type_id,
      status: body.status ?? "active",
    });
    return toProductResponse(product);
  }

  // ================== UPDATE ==================
  public async updatePut(id: number, body: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.findOrFail(id);

    await this.assertActiveProductType(body.product_type_id);

    await this.repository.update(product, {
      name: body.name,
      brand: body.brand,
      price: body.price,
      min_stock: body.min_stock,
      quantity: body.quantity,
      product_type_id: body.product_type_id,
    });
    return toProductResponse(product);
  }

  public async updatePatch(id: number, body: PatchProductDto): Promise<ProductResponseDto> {
    const product = await this.findOrFail(id);

    if (body.product_type_id !== undefined) {
      await this.assertActiveProductType(body.product_type_id);
    }

    await this.repository.update(product, body);
    return toProductResponse(product);
  }

  // ================== DELETE ==================
  /** Eliminación física. */
  public async deletePhysical(id: number): Promise<void> {
    const product = await this.findOrFail(id, false);
    await this.repository.delete(product);
  }

  /** Eliminación lógica -> `status = inactive`. */
  public async deleteLogical(id: number): Promise<ProductResponseDto> {
    const product = await this.findOrFail(id);

    await this.repository.update(product, { status: "inactive" });
    return toProductResponse(product);
  }

  // ================== HELPERS ==================
  private async findOrFail(id: number, onlyActive = true): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product || (onlyActive && product.status !== "active")) {
      throw new AppError(404, "Product not found");
    }
    return product;
  }

  private async assertActiveProductType(product_type_id: number): Promise<void> {
    const productType = await this.productTypesRepository.findById(product_type_id);
    if (!productType) {
      throw new AppError(404, "Product type not found");
    }
    if (productType.status !== "active") {
      throw new AppError(400, "Product type must be active");
    }
  }
}
EOF
```

### Controller

```bash
: > src/features/business/products/products.controller.ts
cat >> src/features/business/products/products.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CreateProductDto, PatchProductDto, UpdateProductDto } from "./dto";
import { ProductsService } from "./products.service";

/**
 * Capa Controller del feature Products.
 * Solo HTTP: lee `req`, llama al service y arma la respuesta.
 */
export class ProductsController extends BaseController {
  public constructor(
    private readonly service: ProductsService = new ProductsService()
  ) {
    super();
  }

  // ================== READ ==================
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const products = await this.service.getAll();
      res.status(200).json({ products });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product = await this.service.getOne(this.paramId(req));
      res.status(200).json({ product });
    });
  }

  // ================== CREATE ==================
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product = await this.service.create(req.body as CreateProductDto);
      res.status(201).json({ product });
    });
  }

  // ================== UPDATE ==================
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product = await this.service.updatePut(
        this.paramId(req),
        req.body as UpdateProductDto
      );
      res.status(200).json({ product });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product = await this.service.updatePatch(
        this.paramId(req),
        req.body as PatchProductDto
      );
      res.status(200).json({ product });
    });
  }

  // ================== DELETE ==================
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Product permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({
        message: "Product deactivated (logical delete)",
        product,
      });
    });
  }
}
EOF
```

### Routes

```bash
: > src/features/business/products/products.routes.ts
cat >> src/features/business/products/products.routes.ts << 'EOF'
import { Application } from "express";
import { ProductsController } from "./products.controller";

export class ProductsRoutes {
  public productsController: ProductsController = new ProductsController();

  public routes(app: Application): void {
    // ================== RUTAS SIN AUTENTICACIÓN / SIN MIDDLEWARE JWT ==================

    app
      .route("/api/productos")
      .get(this.productsController.getAll.bind(this.productsController));

    app
      .route("/api/productos/:id")
      .get(this.productsController.getOne.bind(this.productsController));

    app
      .route("/api/productos")
      .post(this.productsController.create.bind(this.productsController));

    app
      .route("/api/productos/:id")
      .put(this.productsController.updatePut.bind(this.productsController))
      .patch(this.productsController.updatePatch.bind(this.productsController));

    app
      .route("/api/productos/:id")
      .delete(this.productsController.deletePhysical.bind(this.productsController));

    app
      .route("/api/productos/:id/deactivate")
      .patch(this.productsController.deleteLogical.bind(this.productsController));
  }
}
EOF
```

---

## 12.3 HTTP — SIN AUTH

```bash
: > src/features/business/products/http/products.get.http
cat >> src/features/business/products/http/products.get.http << 'EOF'
### Feature Product — GET ALL / GET ONE (SIN AUTH)
@baseUrl = http://localhost:3000
@id = 1

### GET ALL
GET {{baseUrl}}/api/productos

### GET ONE
GET {{baseUrl}}/api/productos/{{id}}
EOF

: > src/features/business/products/http/products.create.http
cat >> src/features/business/products/http/products.create.http << 'EOF'
### Feature Product — CREATE (SIN AUTH)
@baseUrl = http://localhost:3000

POST {{baseUrl}}/api/productos
Content-Type: application/json

{
  "name": "Laptop Pro",
  "brand": "TechBrand",
  "price": 1299.99,
  "min_stock": 5,
  "quantity": 50,
  "product_type_id": 1,
  "status": "active"
}
EOF

: > src/features/business/products/http/products.update.http
cat >> src/features/business/products/http/products.update.http << 'EOF'
### Feature Product — UPDATE (PUT) / UPDATE (PATCH) (SIN AUTH)
@baseUrl = http://localhost:3000
@id = 1

### PUT
PUT {{baseUrl}}/api/productos/{{id}}
Content-Type: application/json

{
  "name": "Laptop Pro Max",
  "brand": "TechBrand",
  "price": 1499.99,
  "min_stock": 5,
  "quantity": 40,
  "product_type_id": 1
}

### PATCH
PATCH {{baseUrl}}/api/productos/{{id}}
Content-Type: application/json

{
  "price": 1399.99,
  "quantity": 45
}
EOF

: > src/features/business/products/http/products.delete.http
cat >> src/features/business/products/http/products.delete.http << 'EOF'
### Feature Product — DELETE físico / DELETE lógico (SIN AUTH)
@baseUrl = http://localhost:3000
@id = 1

### DELETE físico
DELETE {{baseUrl}}/api/productos/{{id}}

### DELETE lógico
PATCH {{baseUrl}}/api/productos/{{id}}/deactivate
EOF
```

---

## 12.4 Cableado

**PARCHE — `src/routes/index.ts`**

Debajo de `import { ProductTypesRoutes } ...`, añadir:

```typescript
import { ProductsRoutes } from "../features/business/products/products.routes";
```

Dentro de `export class Routes`, añadir:

```typescript
  public productsRoutes: ProductsRoutes = new ProductsRoutes();
```

**PARCHE — `src/config/index.ts`**

Debajo de `import "../features/business/product-types/product-type.model";`, añadir:

```typescript
import "../features/business/products/product.model";
```

Dentro de `routes()`, añadir:

```typescript
    this.routePrv.productsRoutes.routes(this.app);
```

---

## 12.5 Relación ProductType ↔ Product

Crea el archivo de asociaciones:

```bash
: > src/features/business/products/products.associations.ts
cat >> src/features/business/products/products.associations.ts << 'EOF'
import { Product } from "./product.model";
import { ProductType } from "../product-types/product-type.model";

Product.belongsTo(ProductType, { foreignKey: "product_type_id", as: "product_type" });
ProductType.hasMany(Product, { foreignKey: "product_type_id", as: "products" });
EOF
```

**PARCHE — `src/config/index.ts`**

Debajo de los imports de modelos `Product` / `ProductType` (y encima de `import { Routes }`), añadir:

```typescript
import "../features/business/products/products.associations";
```

### Verificación relación

```bash
curl -s -X POST http://localhost:3000/api/productos -H 'Content-Type: application/json' \
  -d '{"name":"Cola","brand":"ACME","price":2.5,"min_stock":5,"quantity":100,"product_type_id":1,"status":"active"}'
curl -s http://localhost:3000/api/productos
```

---

## 12.6 Seeder + Swagger Product

### Seeder

```bash
: > src/features/business/products/products.seeder.ts
cat >> src/features/business/products/products.seeder.ts << 'EOF'
import { faker } from "@faker-js/faker";
import { Product } from "./product.model";
import { ProductType } from "../product-types/product-type.model";

/**
 * Seeder del feature Product (datos falsos con @faker-js/faker).
 * Requiere tipos de producto activos. Idempotente.
 */
export async function seedProducts(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️  products: count=0, se omite");
    return 0;
  }

  const existing = await Product.count();
  if (existing > 0) {
    console.log(`⏭️  products: ya hay ${existing} registro(s), se omite seeder`);
    return 0;
  }

  const types = await ProductType.findAll({ where: { status: "active" } });
  if (types.length === 0) {
    console.log("⏭️  products: no hay tipos de producto activos, se omite seeder");
    return 0;
  }

  const rows = Array.from({ length: count }, () => {
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      name: faker.commerce.productName(),
      brand: faker.company.name(),
      price: Number(faker.commerce.price({ min: 5, max: 500, dec: 2 })),
      min_stock: faker.number.int({ min: 1, max: 10 }),
      quantity: faker.number.int({ min: 20, max: 100 }),
      product_type_id: type.id,
      status: "active" as const,
    };
  });

  await Product.bulkCreate(rows);
  console.log(`✅ products: insertados ${count} registro(s) falsos`);
  return count;
}
EOF
```

**PARCHE — `src/database/seeders/counts.ts`**

Añadir `products: number;` dentro de `SeedCounts`, `products: 15,` dentro de `DEFAULT_SEED_COUNTS`, y la lectura de `SEED_PRODUCTS` dentro de `resolveSeedCounts`.

**PARCHE — `src/database/seeders/index.ts`**

Añadir el import del modelo y del seeder, y la llamada `await seedProducts(counts.products);` debajo de `seedProductTypes`.

### Swagger — SIN AUTH

> **NOTA:** el material original importa `swagger-security` (bearerSecurity, etc.). En Fase I no existe. La versión de abajo está adaptada a **SIN AUTH**.

```bash
: > src/features/business/products/products.swagger.ts
cat >> src/features/business/products/products.swagger.ts << 'EOF'
/**
 * Documentación OpenAPI del feature Product.
 * Leyenda: Fase I Business — **SIN AUTH**.
 */

export const productsSwagger = {
  tags: [
    {
      name: "Productos",
      description: "CRUD de productos — **SIN AUTH** (Fase I Business)",
    },
  ],
  paths: {
    "/api/productos": {
      get: {
        tags: ["Productos"],
        summary: "Listar productos activos",
        responses: {
          "200": {
            description: "Lista de productos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    products: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Product" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Productos"],
        summary: "Crear producto",
        description: "product_type_id debe existir y estar active",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "Producto creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    product: { $ref: "#/components/schemas/Product" },
                  },
                },
              },
            },
          },
          "400": { description: "Tipo de producto inactivo" },
          "404": { description: "Tipo de producto no encontrado" },
        },
      },
    },
    "/api/productos/{id}": {
      get: {
        tags: ["Productos"],
        summary: "Obtener producto por id",
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
            description: "Producto encontrado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    product: { $ref: "#/components/schemas/Product" },
                  },
                },
              },
            },
          },
          "400": { description: "id inválido" },
          "404": { description: "No encontrado" },
        },
      },
      put: {
        tags: ["Productos"],
        summary: "Actualizar producto (PUT — reemplazo)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductUpdate" },
            },
          },
        },
        responses: {
          "200": { description: "Actualizado" },
          "400": { description: "id inválido o tipo de producto inactivo" },
          "404": { description: "No encontrado" },
        },
      },
      patch: {
        tags: ["Productos"],
        summary: "Actualizar producto (PATCH — parcial)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductPatch" },
            },
          },
        },
        responses: {
          "200": { description: "Actualizado" },
          "400": { description: "id inválido" },
          "404": { description: "No encontrado" },
        },
      },
      delete: {
        tags: ["Productos"],
        summary: "Eliminar producto (físico)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": { description: "Eliminado" },
          "400": { description: "id inválido" },
          "404": { description: "No encontrado" },
        },
      },
    },
    "/api/productos/{id}/deactivate": {
      patch: {
        tags: ["Productos"],
        summary: "Eliminar producto (lógico)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": { description: "Desactivado" },
          "400": { description: "id inválido" },
          "404": { description: "No encontrado" },
        },
      },
    },
  },
  components: {
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Laptop Pro" },
          brand: { type: "string", example: "TechBrand" },
          price: { type: "number", example: 1299.99 },
          min_stock: { type: "integer", example: 5 },
          quantity: { type: "integer", example: 50 },
          product_type_id: { type: "integer", example: 1 },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductCreate: {
        type: "object",
        required: ["name", "brand", "price", "min_stock", "quantity", "product_type_id"],
        properties: {
          name: { type: "string" },
          brand: { type: "string" },
          price: { type: "number" },
          min_stock: { type: "integer" },
          quantity: { type: "integer" },
          product_type_id: { type: "integer" },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      ProductUpdate: {
        type: "object",
        required: ["name", "brand", "price", "min_stock", "quantity", "product_type_id"],
        properties: {
          name: { type: "string" },
          brand: { type: "string" },
          price: { type: "number" },
          min_stock: { type: "integer" },
          quantity: { type: "integer" },
          product_type_id: { type: "integer" },
        },
      },
      ProductPatch: {
        type: "object",
        properties: {
          name: { type: "string" },
          brand: { type: "string" },
          price: { type: "number" },
          min_stock: { type: "integer" },
          quantity: { type: "integer" },
          product_type_id: { type: "integer" },
        },
      },
    },
  },
};
EOF
```

**PARCHE — `src/swagger/index.ts`**

Debajo de `import { productTypesSwagger } ...`, añadir:

```typescript
import { productsSwagger } from "../features/business/products/products.swagger";
```

Dentro de `featureSwaggerModules`, debajo de `productTypesSwagger,`, añadir:

```typescript
  productsSwagger,
```

---

## Verificación final del ISS-07

```bash
npx tsc --noEmit
npm run dev
```

En otra terminal:

```bash
curl -s -X POST http://localhost:3000/api/productos -H 'Content-Type: application/json' \
  -d '{"name":"Cola","brand":"ACME","price":2.5,"min_stock":5,"quantity":100,"product_type_id":1,"status":"active"}'

curl -s http://localhost:3000/api/productos

npm run db:seed

curl -s http://localhost:3000/api/docs.json | head -c 200
```

Abre en el navegador:

```
http://localhost:3000/api/docs
```

Debes ver **tres tags**: `Clientes`, `TiposProducto` y `Productos`.

---

## Cierre del ISS-07

```bash
npm run dev
```

El servidor debe arrancar sin error. Detenerlo con `Ctrl+C` antes de continuar.

### Commit recomendado

```bash
git add .
git commit -m "ISS-07: Feature Product (CRUD por capas + FK + asociaciones + seeder + swagger)"
```

---

## ✅ GATE de la unidad ISS-07

Las condiciones de cierre son exactamente las que define el ISS técnico de esta misma página:

- 📋 Criterios de aceptación → **Criterios de aceptación**
- 🧩 Cierre de la unidad → **Cierre del ISS**
- 🧠 Autoevaluación → Evaluación del cuaderno

Con el GATE en verde queda habilitado **ISS-08 · Feature Sale + ProductSale**.

---

**Navegación de la ruta:** ← ISS-07 · 🧠 Aprender · ↑ Ruta Express · → ISS-08 · 🧠 Aprender