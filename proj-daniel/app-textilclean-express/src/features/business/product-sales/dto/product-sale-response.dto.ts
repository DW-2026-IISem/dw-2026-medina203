import { ProductSale, ProductSaleI } from "../product-sale.model";

export type ProductSaleResponseDto = ProductSaleI;

export function toProductSaleResponse(productSale: ProductSale): ProductSaleResponseDto {
  return productSale.toJSON() as ProductSaleResponseDto;
}