import { Product } from '../entities/product.entity.js';

export const PRODUCT_REPOSITORY = 'IProductRepository';

export interface IProductRepository {
  create(product: Product): Promise<Product>;
  findAll(page: number, limit: number): Promise<{ items: Product[]; total: number }>;
  findById(id: number): Promise<Product | null>;
  count(): Promise<number>;
}
