import { ProductType } from '../entities/product-type.entity.js';

export const PRODUCT_TYPE_REPOSITORY = 'IProductTypeRepository';

export interface IProductTypeRepository {
  create(productType: ProductType): Promise<ProductType>;
  findAll(page: number, limit: number): Promise<{ items: ProductType[]; total: number }>;
  findById(id: number): Promise<ProductType | null>;
  findByName(name: string): Promise<ProductType | null>;
  count(): Promise<number>;
}
