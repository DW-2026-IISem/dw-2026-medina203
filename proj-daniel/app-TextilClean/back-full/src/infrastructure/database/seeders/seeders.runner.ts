import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ClientSeeder } from '../../../features/business/clients/infrastructure/persistence/seeders/client.seeder.js';
import { ProductTypeSeeder } from '../../../features/business/product-types/infrastructure/persistence/seeders/product-type.seeder.js';
import { ProductSeeder } from '../../../features/business/products/infrastructure/persistence/seeders/product.seeder.js';

@Injectable()
export class SeedersRunner implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedersRunner.name);

  constructor(
    private readonly clientSeeder: ClientSeeder,
    private readonly productTypeSeeder: ProductTypeSeeder,
    private readonly productSeeder: ProductSeeder,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.clientSeeder.seed();
    await this.productTypeSeeder.seed();
    await this.productSeeder.seed();
    this.logger.log('Seeders business ejecutados en orden: clients → product-types → products');
  }
}
