import { Inject, Injectable, Logger } from "@nestjs/common";
import { ProductType } from '../../../domain/entities/product-type.entity.js';
import { PRODUCT_TYPE_REPOSITORY } from '../../../domain/interfaces/product-type.repository.js';
import type { IProductTypeRepository } from '../../../domain/interfaces/product-type.repository.js';

@Injectable()
export class ProductTypeSeeder {
  private readonly logger = new Logger(ProductTypeSeeder.name);

  constructor(
    @Inject(PRODUCT_TYPE_REPOSITORY) private readonly repo: IProductTypeRepository,
  ) {}

  async seed(): Promise<void> {
    const name = 'Bebidas';
    const existing = await this.repo.findByName(name);
    if (existing) {
      this.logger.log('Seeder product-types: ya existía el tipo demo (idempotente)');
      return;
    }
    await this.repo.create(
      new ProductType({ name, description: 'Bebidas y refrescos', status: 'active' }),
    );
    this.logger.log('Seeder product-types: tipo demo creado');
  }
}
