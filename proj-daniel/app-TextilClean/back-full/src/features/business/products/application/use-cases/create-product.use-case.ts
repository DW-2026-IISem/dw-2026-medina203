import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_TYPE_REPOSITORY } from '../../../product-types/domain/interfaces/product-type.repository.js';
import type { IProductTypeRepository } from '../../../product-types/domain/interfaces/product-type.repository.js';
import { ProductTypeNotFoundException } from '../../../product-types/domain/exceptions/product-type-not-found.exception.js';
import { ProductTypeInactiveException } from '../../domain/exceptions/product-type-inactive.exception.js';
import { PRODUCT_REPOSITORY } from '../../domain/interfaces/product.repository.js';
import type { IProductRepository } from '../../domain/interfaces/product.repository.js';
import type { Product } from '../../domain/entities/product.entity.js';
import { CreateProductDto } from '../dto/create-product.dto.js';
import { ProductMapper } from '../mappers/product.mapper.js';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(PRODUCT_TYPE_REPOSITORY) private readonly typeRepo: IProductTypeRepository,
  ) {}

  async execute(dto: CreateProductDto): Promise<Product> {
    const type = await this.typeRepo.findById(dto.productTypeId);
    if (!type) {
      throw new ProductTypeNotFoundException(dto.productTypeId);
    }
    if (type.status !== 'active') {
      throw new ProductTypeInactiveException(dto.productTypeId);
    }
    return this.productRepo.create(ProductMapper.toEntity(dto));
  }
}
