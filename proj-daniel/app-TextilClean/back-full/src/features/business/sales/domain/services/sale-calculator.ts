import { ProductSale } from '../entities/product-sale.entity.js';

export class SaleCalculator {
  subtotal(items: ProductSale[]): number {
    return items.reduce((acc, it) => acc + it.total, 0);
  }

  total(subtotal: number, tax: number, discounts: number): number {
    return subtotal + tax - discounts;
  }
}
