export interface CreateSaleItemDto {
  product_id: number;
  quantity: number;
}

export interface CreateSaleDto {
  client_id: number;
  sale_date?: string | Date;
  tax?: number;
  discounts?: number;
  items: CreateSaleItemDto[];
}