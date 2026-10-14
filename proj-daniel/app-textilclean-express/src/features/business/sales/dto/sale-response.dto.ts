import { Sale, SaleI } from "../sale.model";

export type SaleResponseDto = SaleI;

export function toSaleResponse(sale: Sale): SaleResponseDto {
  return sale.toJSON() as SaleResponseDto;
}