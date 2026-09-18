import { ProductType } from '../../domain/entities/product-type.entity.js';
import { CreateProductTypeDto } from '../dto/create-product-type.dto.js';

export class ProductTypeMapper {
  static toEntity(dto: CreateProductTypeDto): ProductType {
    return new ProductType({
      name: dto.name,
      description: dto.description ?? null,
      status: 'active',
    });
  }

  static toResponse(pt: ProductType) {
    return {
      id: pt.id,
      name: pt.name,
      description: pt.description,
      status: pt.status,
    };
  }
}
