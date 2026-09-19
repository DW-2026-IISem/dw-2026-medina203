import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from '../../../application/dto/create-product.dto.js';
import { ProductMapper } from '../../../application/mappers/product.mapper.js';
import { CreateProductUseCase } from '../../../application/use-cases/create-product.use-case.js';
import { GetProductByIdUseCase } from '../../../application/use-cases/get-product-by-id.use-case.js';
import { ListProductsUseCase } from '../../../application/use-cases/list-products.use-case.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductByIdUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear producto' })
  async create(@Body() dto: CreateProductDto) {
    const product = await this.createProduct.execute(dto);
    return ProductMapper.toResponse(product);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos (paginado)' })
  async list(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.listProducts.execute(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por id' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const product = await this.getProduct.execute(id);
    return ProductMapper.toResponse(product);
  }
}
