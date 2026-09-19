import { ProductSale } from './product-sale.entity.js';

export type SaleStatus = 'completed' | 'cancelled';

export interface SaleProps {
  id?: number | null;
  saleDate?: Date;
  subtotal: number;
  tax: number;
  discounts: number;
  total: number;
  status?: SaleStatus;
  clientId: number;
  items: ProductSale[];
}

export class Sale {
  readonly id: number | null;
  readonly saleDate: Date;
  readonly subtotal: number;
  readonly tax: number;
  readonly discounts: number;
  readonly total: number;
  readonly status: SaleStatus;
  readonly clientId: number;
  readonly items: ProductSale[];

  constructor(props: SaleProps) {
    this.id = props.id ?? null;
    this.saleDate = props.saleDate ?? new Date();
    this.subtotal = props.subtotal;
    this.tax = props.tax;
    this.discounts = props.discounts;
    this.total = props.total;
    this.status = props.status ?? 'completed';
    this.clientId = props.clientId;
    this.items = props.items;
  }
}
