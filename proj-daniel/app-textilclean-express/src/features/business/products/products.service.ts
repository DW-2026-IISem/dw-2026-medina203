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

export class ProductsService {
  public constructor(
    private readonly repository: ProductsRepository = new ProductsRepository(),
    private readonly productTypesRepository: ProductTypesRepository = new ProductTypesRepository()
  ) {}

  public async getAll(): Promise<ProductResponseDto[]> {
    const products = await this.repository.findAllActive();
    return products.map(toProductResponse);
  }

  public async getOne(id: number): Promise<ProductResponseDto> {
    return toProductResponse(await this.findOrFail(id));
  }

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

  public async deletePhysical(id: number): Promise<void> {
    const product = await this.findOrFail(id, false);
    await this.repository.delete(product);
  }

  public async deleteLogical(id: number): Promise<ProductResponseDto> {
    const product = await this.findOrFail(id);
    await this.repository.update(product, { status: "inactive" });
    return toProductResponse(product);
  }

  private async findOrFail(id: number, onlyActive = true): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product || (onlyActive && product.status !== "active")) {
      throw new AppError(404, "Product not found");
    }
    return product;
  }

  private async assertActiveProductType(productTypeId: number): Promise<void> {
    const productType = await this.productTypesRepository.findById(productTypeId);
    if (!productType) throw new AppError(404, "Product type not found");
    if (productType.status !== "active") {
      throw new AppError(400, "Product type must be active");
    }
  }
}