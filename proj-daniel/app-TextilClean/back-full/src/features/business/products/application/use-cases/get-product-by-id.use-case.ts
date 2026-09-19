import { Inject, Injectable } from '@nestjs/common';
import { ProductNotFoundException } from '../../domain/exceptions/product-not-found.exception.js';
import { PRODUCT_REPOSITORY } from '../../domain/interfaces/product.repository.js';
import type { IProductRepository } from '../../domain/interfaces/product.repository.js';
import type { Product } from '../../domain/entities/product.entity.js';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  async execute(id: number): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product) {
      throw new ProductNotFoundException(id);
    }
    return product;
  }
}
