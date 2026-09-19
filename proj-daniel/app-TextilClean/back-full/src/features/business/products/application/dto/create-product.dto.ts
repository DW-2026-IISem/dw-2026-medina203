import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Agua Cristal 600ml' })
  @IsString()
  @IsNotEmpty({ message: 'name es requerido' })
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'Cristal' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiProperty({ example: 2500 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'price debe ser un número' })
  @IsPositive({ message: 'price debe ser mayor que 0' })
  price!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: 'minStock debe ser entero' })
  @Min(0, { message: 'minStock no puede ser negativo' })
  minStock?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt({ message: 'quantity debe ser entero' })
  @Min(0, { message: 'quantity no puede ser negativo' })
  quantity?: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'productTypeId debe ser entero' })
  @Min(1, { message: 'productTypeId es requerido' })
  productTypeId!: number;
}
