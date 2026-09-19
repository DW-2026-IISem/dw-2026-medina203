import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module.js';
import { ProductTypesModule } from './product-types/product-types.module.js';
import { ProductsModule } from './products/products.module.js';
import { SalesModule } from './sales/sales.module.js';

@Module({
  imports: [ClientsModule, ProductTypesModule, ProductsModule, SalesModule],
  exports: [ClientsModule, ProductTypesModule, ProductsModule, SalesModule],
})
export class BusinessModule {}
