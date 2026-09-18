import { Inject, Injectable } from '@nestjs/common';
import { ProductTypeNameAlreadyExistsException } from '../../domain/exceptions/product-type-name-already-exists.exception.js';
import { PRODUCT_TYPE_REPOSITORY } from '../../domain/interfaces/product-type.repository.js';
import type { IProductTypeRepository } from '../../domain/interfaces/product-type.repository.js';
import type { ProductType } from '../../domain/entities/product-type.entity.js';
import { CreateProductTypeDto } from '../dto/create-product-type.dto.js';
import { ProductTypeMapper } from '../mappers/product-type.mapper.js';

@Injectable()
export class CreateProductTypeUseCase {
  constructor(
    @Inject(PRODUCT_TYPE_REPOSITORY) private readonly repo: IProductTypeRepository,
  ) {}

  async execute(dto: CreateProductTypeDto): Promise<ProductType> {
    const existing = await this.repo.findByName(dto.name);
    if (existing) {
      throw new ProductTypeNameAlreadyExistsException(dto.name);
    }
    return this.repo.create(ProductTypeMapper.toEntity(dto));
  }
}
