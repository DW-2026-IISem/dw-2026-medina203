import { Module } from '@nestjs/common';
import { CreateProductTypeUseCase } from './application/use-cases/create-product-type.use-case.js';
import { GetProductTypeByIdUseCase } from './application/use-cases/get-product-type-by-id.use-case.js';
import { ListProductTypesUseCase } from './application/use-cases/list-product-types.use-case.js';
import { PRODUCT_TYPE_REPOSITORY } from './domain/interfaces/product-type.repository.js';
import { ProductTypeRepository } from './infrastructure/persistence/repositories/product-type.repository.js';
import { ProductTypeSeeder } from './infrastructure/persistence/seeders/product-type.seeder.js';
import { ProductTypesController } from './presentation/http/controllers/product-types.controller.js';

@Module({
  controllers: [ProductTypesController],
  providers: [
    CreateProductTypeUseCase,
    ListProductTypesUseCase,
    GetProductTypeByIdUseCase,
    ProductTypeSeeder,
    { provide: PRODUCT_TYPE_REPOSITORY, useClass: ProductTypeRepository },
  ],
  exports: [PRODUCT_TYPE_REPOSITORY, ProductTypeSeeder],
})
export class ProductTypesModule {}
