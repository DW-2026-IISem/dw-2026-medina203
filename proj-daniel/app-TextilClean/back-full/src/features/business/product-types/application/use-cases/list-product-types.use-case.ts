import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_TYPE_REPOSITORY } from '../../domain/interfaces/product-type.repository.js';
import type { IProductTypeRepository } from '../../domain/interfaces/product-type.repository.js';
import { ProductTypeMapper } from '../mappers/product-type.mapper.js';

@Injectable()
export class ListProductTypesUseCase {
  constructor(
    @Inject(PRODUCT_TYPE_REPOSITORY) private readonly repo: IProductTypeRepository,
  ) {}

  async execute(page: number, limit: number) {
    const { items, total } = await this.repo.findAll(page, limit);
    return {
      items: items.map(ProductTypeMapper.toResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
