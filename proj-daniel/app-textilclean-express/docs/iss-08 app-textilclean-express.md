# 🛠 ISS-08 · Feature Sale + ProductSale — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase I:** Business (sin auth ni roles).
**Feature / tabla:** `sales`, `product_sales` → `sales/`, `product-sales/`
**API:** `/api/ventas`, `/api/detalle-ventas` — **SIN AUTH**
**Bloqueado por:** ISS-07 — Feature Product · ISS-03 — Feature Client.
**Habilita:** Cierre del laboratorio (Fase I).

**Objetivo:** ventas con ítems N:M vía feature propio `product-sales/` (tabla `product_sales`, API `/api/detalle-ventas`; detalle: quantity, unit_price, line_total); `create` transaccional de cabecera+ítems en `/api/ventas` con stock.

**Orden de lectura:**
1. Primero se construye el **detalle** (`product-sales/`, sub-ítems con sufijo **b**: 13.1b, 13.2b, 13.3b, 13.4b, 13.6b).
2. Después la **cabecera** (`sales/`: 13.2 … 13.7).

La venta transaccional necesita antes la línea que mueve stock y recalcula totales.

---

## Criterios de aceptación (ISS-08)

- [ ] Feature propio `src/features/business/product-sales/` (model, repository, service, controller, routes, seeder, swagger, http, associations)
- [ ] Rutas `/api/detalle-ventas` montadas en aggregators
- [ ] 13.1 Modelos Sale + feature product-sales/ (tabla product_sales)
- [ ] 13.2 DTOs + Repository + Service + Controller de Sale y ProductSale
- [ ] 13.3 Routes `/api/ventas` + `/api/detalle-ventas` + `http/`
- [ ] 13.4 Seeders: sales → product_sales; claves en SeedCounts; swagger registry
- [ ] 13.5 Relaciones Client↔Sale y Sale↔ProductSale↔Product
- [ ] 13.6 Swagger Sale + ProductSale
- [ ] 13.7 Estado final consolidado (config / routes / seeders / swagger)

```bash
mkdir -p src/features/business/sales/http
mkdir -p src/features/business/product-sales/http
```

---

## 13.1 Modelos Sale y feature ProductSale

**`src/features/business/sales/sale.model.ts`**

```bash
: > src/features/business/sales/sale.model.ts
cat >> src/features/business/sales/sale.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface SaleI {
  id?: number;
  sale_date: Date | string;
  subtotal: number;
  tax: number;
  discounts: number;
  total: number;
  client_id: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class Sale extends Model {
  public id!: number;
  public sale_date!: Date;
  public subtotal!: number;
  public tax!: number;
  public discounts!: number;
  public total!: number;
  public client_id!: number;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Sale.init(
  {
    sale_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    tax: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    discounts: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    client_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Sale",
    tableName: "sales",
    timestamps: true,
  }
);
EOF
```

**`src/features/business/product-sales/product-sale.model.ts`**

```bash
: > src/features/business/product-sales/product-sale.model.ts
cat >> src/features/business/product-sales/product-sale.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

/**
 * Detalle N:M Sale ↔ Product (tabla `product_sales`).
 * `unit_price` = snapshot del precio al vender; `line_total` = quantity × unit_price.
 */
export interface ProductSaleI {
  id?: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductSale extends Model {
  public id!: number;
  public sale_id!: number;
  public product_id!: number;
  public quantity!: number;
  public unit_price!: number;
  public line_total!: number;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductSale.init(
  {
    sale_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    line_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ProductSale",
    tableName: "product_sales",
    timestamps: true,
  }
);
EOF
```

---

## 13.1b Associations ProductSale

```bash
: > src/features/business/product-sales/product-sales.associations.ts
cat >> src/features/business/product-sales/product-sales.associations.ts << 'EOF'
import { ProductSale } from "./product-sale.model";
import { Sale } from "../sales/sale.model";
import { Product } from "../products/product.model";

ProductSale.belongsTo(Sale, { foreignKey: "sale_id", as: "sale" });
ProductSale.belongsTo(Product, { foreignKey: "product_id", as: "product" });
Sale.hasMany(ProductSale, { foreignKey: "sale_id", as: "items" });
Product.hasMany(ProductSale, { foreignKey: "product_id", as: "sale_items" });
EOF
```

---

## 13.2b DTO + Repository + Service + Controller ProductSale

### DTOs

```bash
mkdir -p src/features/business/product-sales/dto
```

**`dto/create-product-sale.dto.ts`**

```bash
: > src/features/business/product-sales/dto/create-product-sale.dto.ts
cat >> src/features/business/product-sales/dto/create-product-sale.dto.ts << 'EOF'
/** Datos de entrada de `POST /api/detalle-ventas`. */
export interface CreateProductSaleDto {
  sale_id: number;
  product_id: number;
  quantity: number;
  status?: "active" | "inactive";
}
EOF
```

**`dto/update-product-sale.dto.ts`**

```bash
: > src/features/business/product-sales/dto/update-product-sale.dto.ts
cat >> src/features/business/product-sales/dto/update-product-sale.dto.ts << 'EOF'
/** Datos de entrada de `PUT /api/detalle-ventas/:id`. */
export interface UpdateProductSaleDto {
  quantity: number;
}
EOF
```

**`dto/patch-product-sale.dto.ts`**

```bash
: > src/features/business/product-sales/dto/patch-product-sale.dto.ts
cat >> src/features/business/product-sales/dto/patch-product-sale.dto.ts << 'EOF'
import { UpdateProductSaleDto } from "./update-product-sale.dto";

export type PatchProductSaleDto = Partial<UpdateProductSaleDto>;
EOF
```

**`dto/product-sale-response.dto.ts`**

```bash
: > src/features/business/product-sales/dto/product-sale-response.dto.ts
cat >> src/features/business/product-sales/dto/product-sale-response.dto.ts << 'EOF'
import { ProductSale, ProductSaleI } from "../product-sale.model";

export type ProductSaleResponseDto = ProductSaleI;

export function toProductSaleResponse(productSale: ProductSale): ProductSaleResponseDto {
  return productSale.toJSON() as ProductSaleResponseDto;
}
EOF
```

**`dto/index.ts`**

```bash
: > src/features/business/product-sales/dto/index.ts
cat >> src/features/business/product-sales/dto/index.ts << 'EOF'
export * from "./create-product-sale.dto";
export * from "./update-product-sale.dto";
export * from "./patch-product-sale.dto";
export * from "./product-sale-response.dto";
EOF
```

### Repository

```bash
: > src/features/business/product-sales/product-sales.repository.ts
cat >> src/features/business/product-sales/product-sales.repository.ts << 'EOF'
import { CreationAttributes, Transaction } from "sequelize";
import { ProductSale, ProductSaleI } from "./product-sale.model";

/**
 * Capa Repository del feature ProductSales (tabla `product_sales`).
 */
export class ProductSalesRepository {
  public async findAllActive(): Promise<ProductSale[]> {
    return ProductSale.findAll({ where: { status: "active" } });
  }

  public async findById(id: number, transaction?: Transaction): Promise<ProductSale | null> {
    return ProductSale.findByPk(id, { transaction });
  }

  public async findByIdForUpdate(
    id: number,
    transaction: Transaction
  ): Promise<ProductSale | null> {
    return ProductSale.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  public async findActiveBySaleId(
    sale_id: number,
    transaction?: Transaction
  ): Promise<ProductSale[]> {
    return ProductSale.findAll({
      where: { sale_id, status: "active" },
      transaction,
    });
  }

  public async create(
    data: CreationAttributes<ProductSale>,
    transaction?: Transaction
  ): Promise<ProductSale> {
    return ProductSale.create(data, { transaction });
  }

  public async update(
    productSale: ProductSale,
    data: Partial<ProductSaleI>,
    transaction?: Transaction
  ): Promise<ProductSale> {
    return productSale.update(data, { transaction });
  }

  public async delete(productSale: ProductSale, transaction?: Transaction): Promise<void> {
    await productSale.destroy({ transaction });
  }

  public async deleteBySaleId(sale_id: number, transaction?: Transaction): Promise<number> {
    return ProductSale.destroy({ where: { sale_id }, transaction });
  }

  public async deactivateBySaleId(
    sale_id: number,
    transaction?: Transaction
  ): Promise<number> {
    const [affected] = await ProductSale.update(
      { status: "inactive" },
      { where: { sale_id }, transaction }
    );
    return affected;
  }
}
EOF
```

### Service

`ProductSalesService` es el más complejo del lab: maneja **locks en orden canónico** (`sales` → `products` → `product_sales`) para evitar deadlocks de InnoDB.

```bash
: > src/features/business/product-sales/product-sales.service.ts
cat >> src/features/business/product-sales/product-sales.service.ts << 'EOF'
import { Transaction } from "sequelize";
import {
  CreateProductSaleDto,
  PatchProductSaleDto,
  ProductSaleResponseDto,
  UpdateProductSaleDto,
  toProductSaleResponse,
} from "./dto";
import { ProductSale } from "./product-sale.model";
import { ProductSalesRepository } from "./product-sales.repository";
import { SalesRepository } from "../sales/sales.repository";
import { ProductsRepository } from "../products/products.repository";
import { Product } from "../products/product.model";
import { AppError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";

/**
 * Capa Service del feature ProductSales (tabla `product_sales`).
 * Orden canónico de locks: `sales` → `products` → `product_sales`.
 */
export class ProductSalesService {
  public constructor(
    private readonly repository: ProductSalesRepository = new ProductSalesRepository(),
    private readonly salesRepository: SalesRepository = new SalesRepository(),
    private readonly productsRepository: ProductsRepository = new ProductsRepository()
  ) {}

  // ================== READ ==================
  public async getAll(): Promise<ProductSaleResponseDto[]> {
    const productSales = await this.repository.findAllActive();
    return productSales.map((productSale) => toProductSaleResponse(productSale));
  }

  public async getOne(id: number): Promise<ProductSaleResponseDto> {
    return toProductSaleResponse(await this.findOrFail(id));
  }

  // ================== CREATE ==================
  public async create(body: CreateProductSaleDto): Promise<ProductSaleResponseDto> {
    if (!body.sale_id || !body.product_id || !body.quantity || body.quantity < 1) {
      throw new AppError(400, "sale_id, product_id and quantity (>=1) are required");
    }

    return withTransaction(async (t) => {
      const sale = await this.salesRepository.findByIdForUpdate(body.sale_id, t);
      if (!sale) throw new AppError(404, "Sale not found");
      if (sale.status !== "active") throw new AppError(400, "Sale must be active");

      const product = await this.productsRepository.findByIdForUpdate(body.product_id, t);
      if (!product) throw new AppError(404, "Product not found");
      if (product.status !== "active") throw new AppError(400, "Product must be active");
      if (product.quantity < body.quantity) {
        throw new AppError(
          400,
          `Insufficient stock (available: ${product.quantity}, requested: ${body.quantity})`
        );
      }

      const unit_price = Number(product.price);
      const line_total = unit_price * body.quantity;

      const productSale = await this.repository.create(
        {
          sale_id: body.sale_id,
          product_id: body.product_id,
          quantity: body.quantity,
          unit_price,
          line_total,
          status: body.status ?? "active",
        },
        t
      );

      await this.productsRepository.update(
        product,
        { quantity: product.quantity - body.quantity },
        t
      );
      await this.recalcSaleTotals(body.sale_id, t);

      return toProductSaleResponse(productSale);
    });
  }

  // ================== UPDATE ==================
  public async updatePut(
    id: number,
    body: UpdateProductSaleDto
  ): Promise<ProductSaleResponseDto> {
    return withTransaction(async (t) => {
      const { productSale, product } = await this.lockLine(id, t);
      const newQty = Number(body.quantity);
      if (!newQty || newQty < 1) throw new AppError(400, "quantity (>=1) is required");
      if (!product) throw new AppError(404, "Product not found");

      await this.applyQuantityDelta(productSale, product, newQty, t);
      await this.repository.update(
        productSale,
        { quantity: newQty, line_total: Number(productSale.unit_price) * newQty },
        t
      );
      await this.recalcSaleTotals(productSale.sale_id, t);
      return toProductSaleResponse(productSale);
    });
  }

  public async updatePatch(
    id: number,
    body: PatchProductSaleDto
  ): Promise<ProductSaleResponseDto> {
    return withTransaction(async (t) => {
      const { productSale, product } = await this.lockLine(id, t);

      if (body.quantity !== undefined) {
        const newQty = Number(body.quantity);
        if (!newQty || newQty < 1) throw new AppError(400, "quantity must be >= 1");
        if (!product) throw new AppError(404, "Product not found");

        await this.applyQuantityDelta(productSale, product, newQty, t);
        await this.repository.update(
          productSale,
          { quantity: newQty, line_total: Number(productSale.unit_price) * newQty },
          t
        );
      }

      await this.recalcSaleTotals(productSale.sale_id, t);
      return toProductSaleResponse(productSale);
    });
  }

  // ================== DELETE ==================
  public async deletePhysical(id: number): Promise<void> {
    await withTransaction(async (t) => {
      const { productSale, product } = await this.lockLine(id, t, false);

      if (productSale.status === "active" && product) {
        await this.productsRepository.update(
          product,
          { quantity: product.quantity + productSale.quantity },
          t
        );
      }

      const sale_id = productSale.sale_id;
      await this.repository.delete(productSale, t);
      await this.recalcSaleTotals(sale_id, t);
    });
  }

  public async deleteLogical(id: number): Promise<ProductSaleResponseDto> {
    return withTransaction(async (t) => {
      const { productSale, product } = await this.lockLine(id, t);

      if (product) {
        await this.productsRepository.update(
          product,
          { quantity: product.quantity + productSale.quantity },
          t
        );
      }

      await this.repository.update(productSale, { status: "inactive" }, t);
      await this.recalcSaleTotals(productSale.sale_id, t);
      return toProductSaleResponse(productSale);
    });
  }

  // ================== HELPERS ==================
  private async findOrFail(id: number, onlyActive = true): Promise<ProductSale> {
    const productSale = await this.repository.findById(id);
    if (!productSale || (onlyActive && productSale.status !== "active")) {
      throw new AppError(404, "Product sale not found");
    }
    return productSale;
  }

  private async lockLine(
    id: number,
    t: Transaction,
    onlyActive = true
  ): Promise<{ productSale: ProductSale; product: Product | null }> {
    const snapshot = await this.repository.findById(id, t);
    if (!snapshot) throw new AppError(404, "Product sale not found");

    await this.salesRepository.findByIdForUpdate(snapshot.sale_id, t);
    const product = await this.productsRepository.findByIdForUpdate(snapshot.product_id, t);
    const productSale = await this.repository.findByIdForUpdate(id, t);

    if (!productSale || (onlyActive && productSale.status !== "active")) {
      throw new AppError(404, "Product sale not found");
    }
    return { productSale, product };
  }

  private async applyQuantityDelta(
    productSale: ProductSale,
    product: Product,
    newQty: number,
    t: Transaction
  ): Promise<void> {
    const delta = newQty - productSale.quantity;
    if (delta > 0 && product.quantity < delta) {
      throw new AppError(
        400,
        `Insufficient stock (available: ${product.quantity}, requested_extra: ${delta})`
      );
    }
    if (delta !== 0) {
      await this.productsRepository.update(product, { quantity: product.quantity - delta }, t);
    }
  }

  private async recalcSaleTotals(sale_id: number, t: Transaction): Promise<void> {
    const items = await this.repository.findActiveBySaleId(sale_id, t);
    const subtotal = items.reduce((sum, row) => sum + Number(row.line_total), 0);

    const sale = await this.salesRepository.findById(sale_id, t);
    if (!sale) return;

    const total = subtotal + Number(sale.tax) - Number(sale.discounts);
    await this.salesRepository.update(sale, { subtotal, total }, t);
  }
}
EOF
```

### Controller

```bash
: > src/features/business/product-sales/product-sales.controller.ts
cat >> src/features/business/product-sales/product-sales.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import {
  CreateProductSaleDto,
  PatchProductSaleDto,
  UpdateProductSaleDto,
} from "./dto";
import { ProductSalesService } from "./product-sales.service";

export class ProductSalesController extends BaseController {
  public constructor(
    private readonly service: ProductSalesService = new ProductSalesService()
  ) {
    super();
  }

  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_sales = await this.service.getAll();
      res.status(200).json({ product_sales });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_sale = await this.service.getOne(this.paramId(req));
      res.status(200).json({ product_sale });
    });
  }

  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_sale = await this.service.create(req.body as CreateProductSaleDto);
      res.status(201).json({ product_sale });
    });
  }

  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_sale = await this.service.updatePut(
        this.paramId(req),
        req.body as UpdateProductSaleDto
      );
      res.status(200).json({ product_sale });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_sale = await this.service.updatePatch(
        this.paramId(req),
        req.body as PatchProductSaleDto
      );
      res.status(200).json({ product_sale });
    });
  }

  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Product sale permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_sale = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({
        message: "Product sale deactivated (logical delete)",
        product_sale,
      });
    });
  }
}
EOF
```

---

## 13.3b Routes ProductSale (`/api/detalle-ventas`)

```bash
: > src/features/business/product-sales/product-sales.routes.ts
cat >> src/features/business/product-sales/product-sales.routes.ts << 'EOF'
import { Application } from "express";
import { ProductSalesController } from "./product-sales.controller";

export class ProductSalesRoutes {
  public productSalesController: ProductSalesController = new ProductSalesController();

  public routes(app: Application): void {
    app
      .route("/api/detalle-ventas")
      .get(this.productSalesController.getAll.bind(this.productSalesController));

    app
      .route("/api/detalle-ventas/:id")
      .get(this.productSalesController.getOne.bind(this.productSalesController));

    app
      .route("/api/detalle-ventas")
      .post(this.productSalesController.create.bind(this.productSalesController));

    app
      .route("/api/detalle-ventas/:id")
      .put(this.productSalesController.updatePut.bind(this.productSalesController))
      .patch(this.productSalesController.updatePatch.bind(this.productSalesController));

    app
      .route("/api/detalle-ventas/:id")
      .delete(this.productSalesController.deletePhysical.bind(this.productSalesController));

    app
      .route("/api/detalle-ventas/:id/deactivate")
      .patch(this.productSalesController.deleteLogical.bind(this.productSalesController));
  }
}
EOF
```

### HTTP ProductSale — SIN AUTH

```bash
: > src/features/business/product-sales/http/product-sales.get.http
cat >> src/features/business/product-sales/http/product-sales.get.http << 'EOF'
### Feature ProductSale — GET (SIN AUTH)
@baseUrl = http://localhost:3000

### GET ALL
GET {{baseUrl}}/api/detalle-ventas

### GET ONE
GET {{baseUrl}}/api/detalle-ventas/1
EOF

: > src/features/business/product-sales/http/product-sales.create.http
cat >> src/features/business/product-sales/http/product-sales.create.http << 'EOF'
### Feature ProductSale — CREATE (SIN AUTH)
@baseUrl = http://localhost:3000

POST {{baseUrl}}/api/detalle-ventas
Content-Type: application/json

{
  "sale_id": 1,
  "product_id": 1,
  "quantity": 2,
  "status": "active"
}
EOF

: > src/features/business/product-sales/http/product-sales.update.http
cat >> src/features/business/product-sales/http/product-sales.update.http << 'EOF'
### Feature ProductSale — UPDATE (SIN AUTH)
@baseUrl = http://localhost:3000

### PUT
PUT {{baseUrl}}/api/detalle-ventas/1
Content-Type: application/json

{ "quantity": 3 }

### PATCH
PATCH {{baseUrl}}/api/detalle-ventas/1
Content-Type: application/json

{ "quantity": 1 }
EOF

: > src/features/business/product-sales/http/product-sales.delete.http
cat >> src/features/business/product-sales/http/product-sales.delete.http << 'EOF'
### Feature ProductSale — DELETE (SIN AUTH)
@baseUrl = http://localhost:3000

### DELETE físico
DELETE {{baseUrl}}/api/detalle-ventas/1

### DELETE lógico
PATCH {{baseUrl}}/api/detalle-ventas/1/deactivate
EOF
```

---

## 13.4b Seeder ProductSale

```bash
: > src/features/business/product-sales/product-sales.seeder.ts
cat >> src/features/business/product-sales/product-sales.seeder.ts << 'EOF'
import { faker } from "@faker-js/faker";
import { sequelize } from "../../../database/db";
import { ProductSale } from "./product-sale.model";
import { Sale } from "../sales/sale.model";
import { Product } from "../products/product.model";

/**
 * Seeder del feature ProductSale (tabla `product_sales`).
 * Requiere ventas y productos activos. Idempotente.
 * Recalcula subtotal/total de cada venta afectada y reduce stock.
 */
export async function seedProductSales(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️  product_sales: count=0, se omite");
    return 0;
  }

  const existing = await ProductSale.count();
  if (existing > 0) {
    console.log(`⏭️  product_sales: ya hay ${existing} registro(s), se omite seeder`);
    return 0;
  }

  const sales = await Sale.findAll({ where: { status: "active" } });
  const products = await Product.findAll({ where: { status: "active" } });

  if (sales.length === 0 || products.length === 0) {
    console.log("⏭️  product_sales: faltan ventas o productos activos, se omite seeder");
    return 0;
  }

  let created = 0;
  let saleIndex = 0;

  while (created < count && saleIndex < sales.length * 3) {
    const sale = sales[saleIndex % sales.length];
    saleIndex += 1;

    const t = await sequelize.transaction();
    try {
      const product = products[Math.floor(Math.random() * products.length)];
      const fresh = await Product.findByPk(product.id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!fresh || fresh.quantity < 1) {
        await t.rollback();
        continue;
      }

      const quantity = Math.min(
        fresh.quantity,
        faker.number.int({ min: 1, max: Math.min(3, fresh.quantity) })
      );
      const unit_price = Number(fresh.price);
      const line_total = unit_price * quantity;

      await ProductSale.create(
        {
          sale_id: sale.id,
          product_id: fresh.id,
          quantity,
          unit_price,
          line_total,
          status: "active",
        },
        { transaction: t }
      );

      await fresh.update({ quantity: fresh.quantity - quantity }, { transaction: t });

      const items = await ProductSale.findAll({
        where: { sale_id: sale.id, status: "active" },
        transaction: t,
      });
      const subtotal = items.reduce((sum, row) => sum + Number(row.line_total), 0);
      const saleRow = await Sale.findByPk(sale.id, { transaction: t });
      if (saleRow) {
        const total = subtotal + Number(saleRow.tax) - Number(saleRow.discounts);
        await saleRow.update({ subtotal, total }, { transaction: t });
      }

      await t.commit();
      created += 1;
    } catch {
      await t.rollback();
    }
  }

  console.log(`✅ product_sales: insertados ${created} registro(s) falsos`);
  return created;
}
EOF
```

### Swagger ProductSale — SIN AUTH

> **NOTA:** la versión de abajo está adaptada a **SIN AUTH** (sin `swagger-security`).

```bash
: > src/features/business/product-sales/product-sales.swagger.ts
cat >> src/features/business/product-sales/product-sales.swagger.ts << 'EOF'
/**
 * Documentación OpenAPI del feature ProductSale (tabla product_sales).
 * Leyenda: Fase I Business — **SIN AUTH**.
 */

export const productSalesSwagger = {
  tags: [
    {
      name: "DetalleVentas",
      description:
        "CRUD de líneas Sale↔Product (tabla product_sales) — **SIN AUTH** (Fase I Business)",
    },
  ],
  paths: {
    "/api/detalle-ventas": {
      get: {
        tags: ["DetalleVentas"],
        summary: "Listar detalles de venta activos",
        responses: {
          "200": {
            description: "Lista de detalles",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    product_sales: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ProductSale" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["DetalleVentas"],
        summary: "Agregar línea a una venta",
        description:
          "Valida venta/producto activos y stock; crea product_sale, reduce quantity y recalcula totales de la venta",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductSaleCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "Línea creada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    product_sale: { $ref: "#/components/schemas/ProductSale" },
                  },
                },
              },
            },
          },
          "400": { description: "Validación (venta/producto/stock)" },
          "404": { description: "Venta o producto no encontrado" },
        },
      },
    },
    "/api/detalle-ventas/{id}": {
      get: {
        tags: ["DetalleVentas"],
        summary: "Obtener detalle por id",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": {
            description: "Detalle encontrado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    product_sale: { $ref: "#/components/schemas/ProductSale" },
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
        tags: ["DetalleVentas"],
        summary: "Actualizar cantidad de línea (PUT)",
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
              schema: { $ref: "#/components/schemas/ProductSaleUpdate" },
            },
          },
        },
        responses: {
          "200": { description: "Actualizado" },
          "400": { description: "stock insuficiente" },
          "404": { description: "No encontrado" },
        },
      },
      patch: {
        tags: ["DetalleVentas"],
        summary: "Actualizar línea (PATCH)",
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
              schema: { $ref: "#/components/schemas/ProductSalePatch" },
            },
          },
        },
        responses: {
          "200": { description: "Actualizado" },
          "404": { description: "No encontrado" },
        },
      },
      delete: {
        tags: ["DetalleVentas"],
        summary: "Eliminar línea (físico)",
        description: "Restaura stock y recalcula totales",
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
          "404": { description: "No encontrado" },
        },
      },
    },
    "/api/detalle-ventas/{id}/deactivate": {
      patch: {
        tags: ["DetalleVentas"],
        summary: "Eliminar línea (lógico)",
        description: "status = inactive; restaura stock y recalcula totales",
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
          "404": {