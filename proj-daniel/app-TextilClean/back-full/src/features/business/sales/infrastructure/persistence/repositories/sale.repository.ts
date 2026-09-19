import { Inject, Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { SEQUELIZE } from '../../../../../../infrastructure/database/sequelize/sequelize.module.js';
import { ProductModel } from '../../../../products/infrastructure/persistence/models/product.model.js';
import { ProductNotFoundException } from '../../../../products/domain/exceptions/product-not-found.exception.js';
import { InsufficientStockException } from '../../../../products/domain/exceptions/insufficient-stock.exception.js';
import { ProductSale } from '../../../domain/entities/product-sale.entity.js';
import { Sale } from '../../../domain/entities/sale.entity.js';
import type { SaleStatus } from '../../../domain/entities/sale.entity.js';
import { ISaleRepository } from '../../../domain/interfaces/sale.repository.js';
import { ProductSaleModel } from '../models/product-sale.model.js';
import { SaleModel } from '../models/sale.model.js';

@Injectable()
export class SaleRepository implements ISaleRepository {
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

  async create(sale: Sale): Promise<Sale> {
    return this.sequelize.transaction(async (t) => {
      const saleRepo = this.sequelize.getRepository(SaleModel);
      const psRepo = this.sequelize.getRepository(ProductSaleModel);
      const productRepo = this.sequelize.getRepository(ProductModel);

      // 1. Bloquear y re-verificar stock de cada producto (FOR UPDATE)
      const locked = new Map<number, ProductModel>();
      for (const item of sale.items) {
        const product = await productRepo.findByPk(item.productId, {
          lock: Transaction.LOCK.UPDATE,
          transaction: t,
        });
        if (!product) {
          throw new ProductNotFoundException(item.productId);
        }
        if (product.quantity < item.quantity) {
          throw new InsufficientStockException(item.productId, product.quantity, item.quantity);
        }
        locked.set(item.productId, product);
      }

      // 2. Insertar la venta
      const created = await saleRepo.create(
        {
          saleDate: sale.saleDate,
          subtotal: sale.subtotal,
          tax: sale.tax,
          discounts: sale.discounts,
          total: sale.total,
          status: sale.status,
          clientId: sale.clientId,
        },
        { transaction: t },
      );

      // 3. Insertar ítems y descontar stock
      const persistedItems: ProductSale[] = [];
      for (const item of sale.items) {
        const ps = await psRepo.create(
          {
            saleId: created.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          },
          { transaction: t },
        );
        persistedItems.push(
          new ProductSale({
            id: ps.id,
            saleId: ps.saleId,
            productId: ps.productId,
            quantity: ps.quantity,
            unitPrice: Number(ps.unitPrice),
            total: Number(ps.total),
          }),
        );
        const product = locked.get(item.productId)!;
        await product.update(
          { quantity: product.quantity - item.quantity },
          { transaction: t },
        );
      }

      return this.toDomain(created, persistedItems);
    });
  }

  async findById(id: number): Promise<Sale | null> {
    const saleRepo = this.sequelize.getRepository(SaleModel);
    const psRepo = this.sequelize.getRepository(ProductSaleModel);
    const found = await saleRepo.findByPk(id);
    if (!found) {
      return null;
    }
    const itemModels = await psRepo.findAll({
      where: { saleId: id },
      order: [['id', 'ASC']],
    });
    const items = itemModels.map(
      (m) =>
        new ProductSale({
          id: m.id,
          saleId: m.saleId,
          productId: m.productId,
          quantity: m.quantity,
          unitPrice: Number(m.unitPrice),
          total: Number(m.total),
        }),
    );
    return this.toDomain(found, items);
  }

  private toDomain(m: SaleModel, items: ProductSale[]): Sale {
    return new Sale({
      id: m.id,
      saleDate: m.saleDate,
      subtotal: Number(m.subtotal),
      tax: Number(m.tax),
      discounts: Number(m.discounts),
      total: Number(m.total),
      status: (m.status as SaleStatus) ?? 'completed',
      clientId: m.clientId,
      items,
    });
  }
}
