import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';

export class SaleItemDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'productId debe ser entero' })
  @Min(1, { message: 'productId es requerido' })
  productId!: number;

  @ApiProperty({ example: 2 })
  @IsInt({ message: 'quantity debe ser entero' })
  @Min(1, { message: 'quantity debe ser mayor que 0' })
  quantity!: number;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'unitPrice debe ser un número' })
  @IsPositive({ message: 'unitPrice debe ser mayor que 0' })
  unitPrice?: number;
}

export class CreateSaleDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'clientId debe ser entero' })
  @Min(1, { message: 'clientId es requerido' })
  clientId!: number;

  @ApiProperty({ type: [SaleItemDto] })
  @IsArray({ message: 'items debe ser un arreglo' })
  @ArrayMinSize(1, { message: 'items debe tener al menos un ítem' })
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'tax debe ser un número' })
  @Min(0, { message: 'tax no puede ser negativo' })
  tax?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'discounts debe ser un número' })
  @Min(0, { message: 'discounts no puede ser negativo' })
  discounts?: number;
}
