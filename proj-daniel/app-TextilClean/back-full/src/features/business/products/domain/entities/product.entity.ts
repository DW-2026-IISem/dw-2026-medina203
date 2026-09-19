import { InsufficientStockException } from '../exceptions/insufficient-stock.exception.js';

export type ProductStatus = 'active' | 'inactive';

export interface ProductProps {
  id?: number | null;
  name: string;
  brand?: string | null;
  price: number;
  minStock: number;
  quantity: number;
  productTypeId: number;
  status?: ProductStatus;
}

export class Product {
  readonly id: number | null;
  readonly name: string;
  readonly brand: string | null;
  readonly price: number;
  readonly minStock: number;
  quantity: number;
  readonly productTypeId: number;
  readonly status: ProductStatus;

  constructor(props: ProductProps) {
    this.id = props.id ?? null;
    this.name = props.name;
    this.brand = props.brand ?? null;
    this.price = props.price;
    this.minStock = props.minStock;
    this.quantity = props.quantity;
    this.productTypeId = props.productTypeId;
    this.status = props.status ?? 'active';
  }

  reduceStock(n: number): void {
    if (n < 0) {
      throw new InsufficientStockException(this.id, this.quantity, n);
    }
    if (this.quantity - n < 0) {
      throw new InsufficientStockException(this.id, this.quantity, n);
    }
    this.quantity -= n;
  }
}
