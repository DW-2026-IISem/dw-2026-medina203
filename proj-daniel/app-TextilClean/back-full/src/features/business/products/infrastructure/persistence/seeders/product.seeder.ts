import { Inject, Injectable, Logger } from "@nestjs/common";
import { PRODUCT_TYPE_REPOSITORY } from '../../../../product-types/domain/interfaces/product-type.repository.js';
import type { IProductTypeRepository } from '../../../../product-types/domain/interfaces/product-type.repository.js';
import { Product } from '../../../domain/entities/product.entity.js';
import { PRODUCT_REPOSITORY } from '../../../domain/interfaces/product.repository.js';
import type { IProductRepository } from '../../../domain/interfaces/product.repository.js';

@Injectable()
export class ProductSeeder {
  private readonly logger = new Logger(ProductSeeder.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(PRODUCT_TYPE_REPOSITORY) private readonly typeRepo: IProductTypeRepository,
  ) {}

  async seed(): Promise<void> {
    const { items: types } = await this.typeRepo.findAll(1, 100);
    const activeType = types.find((t) => t.status === 'active');
    if (!activeType || activeType.id === null) {
      this.logger.warn('Seeder products: sin tipo de producto activo; no se siembra');
      return;
    }
    const { items: products } = await this.productRepo.findAll(1, 100);
    if (products.some((p) => p.name === 'Agua Cristal 600ml')) {
      this.logger.log('Seeder products: ya existía el producto demo (idempotente)');
      return;
    }
    await this.productRepo.create(
      new Product({
        name: 'Agua Cristal 600ml',
        brand: 'Cristal',
        price: 2500,
        minStock: 1,
        quantity: 5,
        productTypeId: activeType.id,
        status: 'active',
      }),
    );
    this.logger.log('Seeder products: producto demo creado');
  }
}
