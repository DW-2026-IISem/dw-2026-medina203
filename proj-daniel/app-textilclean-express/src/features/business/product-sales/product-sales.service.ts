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

export class ProductSalesService {
  public constructor(
    private readonly repository: ProductSalesRepository = new ProductSalesRepository(),
    private readonly salesRepository: SalesRepository = new SalesRepository(),
    private readonly productsRepository: ProductsRepository = new ProductsRepository()
  ) {}

  public async getAll(): Promise<ProductSaleResponseDto[]> {
    const rows = await this.repository.findAllActive();
    return rows.map(toProductSaleResponse);
  }

  public async getOne(id: number): Promise<ProductSaleResponseDto> {
    return toProductSaleResponse(await this.findOrFail(id));
  }

  public async create(body: CreateProductSaleDto): Promise<ProductSaleResponseDto> {
    if (!Number.isInteger(body.sale_id) || body.sale_id < 1 ||
        !Number.isInteger(body.product_id) || body.product_id < 1 ||
        !Number.isInteger(body.quantity) || body.quantity < 1) {
      throw new AppError(400, "sale_id, product_id and quantity (>=1) are required");
    }

    return withTransaction(async (transaction) => {
      const sale = await this.salesRepository.findByIdForUpdate(body.sale_id, transaction);
      if (!sale || sale.status !== "active") throw new AppError(404, "Sale not found");

      const product = await this.productsRepository.findByIdForUpdate(body.product_id, transaction);
      if (!product) throw new AppError(404, "Product not found");
      if (product.status !== "active") throw new AppError(400, "Product must be active");
      if (product.quantity < body.quantity) {
        throw new AppError(400, `Insufficient stock (available: ${product.quantity})`);
      }

      const unitPrice = Number(product.price);
      const productSale = await this.repository.create(
        {
          sale_id: sale.id,
          product_id: product.id,
          quantity: body.quantity,
          unit_price: unitPrice,
          line_total: roundMoney(unitPrice * body.quantity),
          status: "active",
        },
        transaction
      );
      await this.productsRepository.update(
        product,
        { quantity: product.quantity - body.quantity },
        transaction
      );
      await this.recalcSaleTotals(sale.id, transaction);
      return toProductSaleResponse(productSale);
    });
  }

  public async updatePut(id: number, body: UpdateProductSaleDto): Promise<ProductSaleResponseDto> {
    return this.updateQuantity(id, body.quantity);
  }

  public async updatePatch(id: number, body: PatchProductSaleDto): Promise<ProductSaleResponseDto> {
    if (body.quantity === undefined) return this.getOne(id);
    return this.updateQuantity(id, body.quantity);
  }

  public async deletePhysical(id: number): Promise<void> {
    await withTransaction(async (transaction) => {
      const { productSale, product } = await this.lockLine(id, transaction, false);
      if (productSale.status === "active" && product) {
        await this.productsRepository.update(
          product,
          { quantity: product.quantity + productSale.quantity },
          transaction
        );
      }
      const saleId = productSale.sale_id;
      await this.repository.delete(productSale, transaction);
      await this.recalcSaleTotals(saleId, transaction);
    });
  }

  public async deleteLogical(id: number): Promise<ProductSaleResponseDto> {
    return withTransaction(async (transaction) => {
      const { productSale, product } = await this.lockLine(id, transaction);
      if (product) {
        await this.productsRepository.update(
          product,
          { quantity: product.quantity + productSale.quantity },
          transaction
        );
      }
      await this.repository.update(productSale, { status: "inactive" }, transaction);
      await this.recalcSaleTotals(productSale.sale_id, transaction);
      return toProductSaleResponse(productSale);
    });
  }

  private async updateQuantity(id: number, rawQuantity: number): Promise<ProductSaleResponseDto> {
    const quantity = Number(rawQuantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new AppError(400, "quantity must be a positive integer");
    }

    return withTransaction(async (transaction) => {
      const { productSale, product } = await this.lockLine(id, transaction);
      if (!product) throw new AppError(404, "Product not found");
      const delta = quantity - productSale.quantity;
      if (delta > 0 && product.status !== "active") {
        throw new AppError(400, "Product must be active");
      }
      if (delta > 0 && product.quantity < delta) {
        throw new AppError(400, `Insufficient stock (available: ${product.quantity})`);
      }
      if (delta !== 0) {
        await this.productsRepository.update(product, { quantity: product.quantity - delta }, transaction);
      }
      await this.repository.update(
        productSale,
        { quantity, line_total: roundMoney(Number(productSale.unit_price) * quantity) },
        transaction
      );
      await this.recalcSaleTotals(productSale.sale_id, transaction);
      return toProductSaleResponse(productSale);
    });
  }

  private async findOrFail(id: number, onlyActive = true): Promise<ProductSale> {
    const productSale = await this.repository.findById(id);
    if (!productSale || (onlyActive && productSale.status !== "active")) {
      throw new AppError(404, "Product sale not found");
    }
    return productSale;
  }

  private async lockLine(
    id: number,
    transaction: Transaction,
    onlyActive = true
  ): Promise<{ productSale: ProductSale; product: Product | null }> {
    const snapshot = await this.repository.findById(id, transaction);
    if (!snapshot) throw new AppError(404, "Product sale not found");

    const sale = await this.salesRepository.findByIdForUpdate(snapshot.sale_id, transaction);
    if (!sale || sale.status !== "active") throw new AppError(404, "Sale not found");
    const product = await this.productsRepository.findByIdForUpdate(snapshot.product_id, transaction);
    const productSale = await this.repository.findByIdForUpdate(id, transaction);
    if (!productSale || (onlyActive && productSale.status !== "active")) {
      throw new AppError(404, "Product sale not found");
    }
    return { productSale, product };
  }

  private async recalcSaleTotals(saleId: number, transaction: Transaction): Promise<void> {
    const rows = await this.repository.findActiveBySaleId(saleId, transaction);
    const subtotal = roundMoney(rows.reduce((sum, row) => sum + Number(row.line_total), 0));
    const sale = await this.salesRepository.findById(saleId, transaction);
    if (!sale) return;
    const total = roundMoney(subtotal + Number(sale.tax) - Number(sale.discounts));
    await this.salesRepository.update(sale, { subtotal, total }, transaction);
  }
}

function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}