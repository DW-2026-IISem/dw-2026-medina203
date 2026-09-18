import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductTypeDto {
  @ApiProperty({ example: 'Bebidas' })
  @IsString()
  @IsNotEmpty({ message: 'name es requerido' })
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Bebidas y refrescos' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
