import { Inject, Injectable } from '@nestjs/common';
import { SaleNotFoundException } from '../../domain/exceptions/sale-not-found.exception.js';
import { SALE_REPOSITORY } from '../../domain/interfaces/sale.repository.js';
import type { ISaleRepository } from '../../domain/interfaces/sale.repository.js';
import type { Sale } from '../../domain/entities/sale.entity.js';

@Injectable()
export class GetSaleByIdUseCase {
  constructor(@Inject(SALE_REPOSITORY) private readonly saleRepo: ISaleRepository) {}

  async execute(id: number): Promise<Sale> {
    const sale = await this.saleRepo.findById(id);
    if (!sale) {
      throw new SaleNotFoundException(id);
    }
    return sale;
  }
}
