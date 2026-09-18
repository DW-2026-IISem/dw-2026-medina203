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
import { CreateProductTypeDto } from '../../../application/dto/create-product-type.dto.js';
import { ProductTypeMapper } from '../../../application/mappers/product-type.mapper.js';
import { CreateProductTypeUseCase } from '../../../application/use-cases/create-product-type.use-case.js';
import { GetProductTypeByIdUseCase } from '../../../application/use-casetype-by-id.use-case.js';
import { ListProductTypesUseCase } from '../../../application/use-cases/list-product-types.use-case.js';

@ApiTags('product-types')
@Controller('product-types')
export class ProductTypesController {
  constructor(
    private readonly createProductType: CreateProductTypeUseCase,
    private readonly listProductTypes: ListProductTypesUseCase,
    private readonly getProductType: GetProductTypeByIdUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear tipo de producto' })
  async create(@Body() dto: CreateProductTypeDto) {
    const pt = await this.createProductType.execute(dto);
    return ProductTypeMapper.toResponse(pt);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de producto (paginado)' })
  async list(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.listProductTypes.execute(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tipo de producto por id' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const pt = await this.getProductType.execute(id);
    return ProductTypeMapper.toResponse(pt);
  }
}
