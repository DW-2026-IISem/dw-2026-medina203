export interface CreateProductDto {
  name: string;
  brand: string;
  price: number;
  min_stock: number;
  quantity: number;
  product_type_id: number;
  status?: "active" | "inactive";
}