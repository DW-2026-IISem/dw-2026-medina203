import { Inject, Injectable } from '@nestjs/common';
import { CLIENT_REPOSITORY } from '../../../clients/domain/interfaces/client.repository.js';
import type { IClientRepository } from '../../../clients/domain/interfaces/client.repository.js';
import { ClientNotFoundException } from '../../../clients/domain/exceptions/client-not-found.exception.js';
import { PRODUCT_REPOSITORY } from '../../../products/domain/interfaces/product.repository.js';
import type { IProductRepository } from '../../../products/domain/interfaces/product.repository.js';
import { ProductNotFoundException } from '../../../products/domain/exceptions/product-not-found.exception.js';
import type { Product } from '../../../products/domain/entities/product.entity.js';
import { ProductSale } from '../../domain/entities/product-sale.entity.js';
import { Sale } from '../../domain/entities/sale.entity.js';
import { EmptySaleException } from '../../domain/exceptions/empty-sale.exception.js';
import { SaleCalculator } from '../../domain/services/sale-calculator.js';
import { SALE_REPOSITORY } from '../../domain/interfaces/sale.repository.js';
import type { ISaleRepository } from '../../domain/interfaces/sale.repository.js';
import { CreateSaleDto } from '../dto/create-sale.dto.js';

@Injectable()
export class CreateSaleUseCase {
  private readonly calculator = new SaleCalculator();

  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clientRepo: IClientRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(SALE_REPOSITORY) private readonly saleRepo: ISaleRepository,
  ) {}

  async execute(dto: CreateSaleDto): Promise<Sale> {
    const client = await this.clientRepo.findById(dto.clientId);
    if (!client) {
      throw new ClientNotFoundException(dto.clientId);
    }

    if (!dto.items || dto.items.length === 0) {
      throw new EmptySaleException();
    }

    const products = new Map<number, Product>();
    for (const it of dto.items) {
      const product = await this.productRepo.findById(it.productId);
      if (!product) {
        throw new ProductNotFoundException(it.productId);
      }
      products.set(it.productId, product);
    }

    const items: ProductSale[] = dto.items.map((it) => {
      const product = products.get(it.productId)!;
      const unitPrice = it.unitPrice ?? product.price;
      const quantity = it.quantity;
      product.reduceStock(quantity); // regla de dominio: lanza 409 si no alcanza
      return new ProductSale({
        productId: it.productId,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      });
    });

    const subtotal = this.calculator.subtotal(items);
    const tax = dto.tax ?? 0;
    const discounts = dto.discounts ?? 0;
    const total = this.calculator.total(subtotal, tax, discounts);

    const sale = new Sale({
      clientId: dto.clientId,
      subtotal,
      tax,
      discounts,
      total,
      status: 'completed',
      items,
    });

    return this.saleRepo.create(sale);
  }
}
