import { Product, ProductI } from "../product.model";

export type ProductResponseDto = ProductI;

export function toProductResponse(product: Product): ProductResponseDto {
  return product.toJSON() as ProductResponseDto;
}