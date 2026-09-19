import { Inject, Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { SEQUELIZE } from '../../../../../../infrastructure/database/sequelize/sequelize.module.js';
import { Product } from '../../../domain/entities/product.entity.js';
import type { ProductStatus } from '../../../domain/entities/product.entity.js';
import { IProductRepository } from '../../../domain/interfaces/product.repository.js';
import { ProductModel } from '../models/product.model.js';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

  private get repo() {
    return this.sequelize.getRepository(ProductModel);
  }

  async create(product: Product): Promise<Product> {
    const created = await this.repo.create({
      name: product.name,
      brand: product.brand,
      price: product.price,
      minStock: product.minStock,
      quantity: product.quantity,
      productTypeId: product.productTypeId,
      status: product.status,
    });
    return this.toDomain(created);
  }

  async findAll(page: number, limit: number) {
    const { rows, count } = await this.repo.findAndCountAll({
      offset: (page - 1) * limit,
      limit,
      order: [['id', 'ASC']],
    });
    return { items: rows.map((r) => this.toDomain(r)), total: count };
  }

  async findById(id: number): Promise<Product | null> {
    const found = await this.repo.findByPk(id);
    return found ? this.toDomain(found) : null;
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  private toDomain(m: ProductModel): Product {
    return new Product({
      id: m.id,
      name: m.name,
      brand: m.brand ?? null,
      price: Number(m.price),
      minStock: m.minStock,
      quantity: m.quantity,
      productTypeId: m.productTypeId,
      status: (m.status as ProductStatus) ?? 'active',
    });
  }
}
