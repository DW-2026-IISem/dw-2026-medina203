import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../../domain/interfaces/product.repository.js';
import type { IProductRepository } from '../../domain/interfaces/product.repository.js';
import { ProductMapper } from '../mappers/product.mapper.js';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  async execute(page: number, limit: number) {
    const { items, total } = await this.productRepo.findAll(page, limit);
    return {
      items: items.map(ProductMapper.toResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
