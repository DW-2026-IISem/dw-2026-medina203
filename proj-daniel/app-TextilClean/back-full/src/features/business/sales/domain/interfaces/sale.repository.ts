import { Sale } from '../entities/sale.entity.js';

export const SALE_REPOSITORY = 'ISaleRepository';

export interface ISaleRepository {
  create(sale: Sale): Promise<Sale>;
  findById(id: number): Promise<Sale | null>;
}
