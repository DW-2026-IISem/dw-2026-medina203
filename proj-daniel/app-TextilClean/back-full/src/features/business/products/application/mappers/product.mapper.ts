import { Product } from '../../domain/entities/product.entity.js';
import { CreateProductDto } from '../dto/create-product.dto.js';

export class ProductMapper {
  static toEntity(dto: CreateProductDto): Product {
    return new Product({
      name: dto.name,
      brand: dto.brand ?? null,
      price: dto.price,
      minStock: dto.minStock ?? 0,
      quantity: dto.quantity ?? 0,
      productTypeId: dto.productTypeId,
      status: 'active',
    });
  }

  static toResponse(p: Product) {
    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      minStock: p.minStock,
      quantity: p.quantity,
      productTypeId: p.productTypeId,
      status: p.status,
    };
  }
}
