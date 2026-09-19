import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module.js';
import { ProductsModule } from '../products/products.module.js';
import { CreateSaleUseCase } from './application/use-cases/create-sale.use-case.js';
import { GetSaleByIdUseCase } from './application/use-cases/get-sale-by-id.use-case.js';
import { SALE_REPOSITORY } from './domain/interfaces/sale.repository.js';
import { SaleRepository } from './infrastructure/persistence/repositories/sale.repository.js';
import { SalesController } from './presentation/http/controllers/sales.controller.js';

@Module({
  imports: [ClientsModule, ProductsModule],
  controllers: [SalesController],
  providers: [
    CreateSaleUseCase,
    GetSaleByIdUseCase,
    { provide: SALE_REPOSITORY, useClass: SaleRepository },
  ],
  exports: [SALE_REPOSITORY],
})
export class SalesModule {}
