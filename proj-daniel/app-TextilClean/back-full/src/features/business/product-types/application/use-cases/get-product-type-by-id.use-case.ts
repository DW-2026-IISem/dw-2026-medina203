import { Inject, Injectable } from '@nestjs/common';
import { ProductTypeNotFoundException } from '../../domain/exceptions/product-type-not-found.exception.js';
import { PRODUCT_TYPE_REPOSITORY } from '../../domain/interfaces/product-type.repository.js';
import type { IProductTypeRepository } from '../../domain/interfaces/product-type.repository.js';
import type { ProductType } from '../../domain/entities/product-type.entity.js';

@Injectable()
export class GetProductTypeByIdUseCase {
  constructor(
    @Inject(PRODUCT_TYPE_REPOSITORY) private readonly repo: IProductTypeRepository,
  ) {}

  async execute(id: number): Promise<ProductType> {
    const pt = await this.repo.findById(id);
    if (!pt) {
      throw new ProductTypeNotFoundException(id);
    }
    return pt;
  }
}
