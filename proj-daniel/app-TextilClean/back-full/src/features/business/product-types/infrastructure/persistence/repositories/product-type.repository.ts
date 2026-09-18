import { Inject, Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { SEQUELIZE } from '../../../../../../infrastructure/database/sequelize/sequelize.module.js';
import { ProductType } from '../../../domain/entities/product-type.entity.js';
import type { ProductTypeStatus } from '../../../domain/entities/product-type.entity.js';
import { IProductTypeRepository } from '../../../domain/interfaces/product-type.repository.js';
import { ProductTypeModel } from '../models/product-type.model.js';

@Injectable()
export class ProductTypeRepository implements IProductTypeRepository {
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

  private get repo() {
    return this.sequelize.getRepository(ProductTypeModel);
  }

  async create(pt: ProductType): Promise<ProductType> {
    const created = await this.repo.create({
      name: pt.name,
      description: pt.description,
      status: pt.status,
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

  async findById(id: number): Promise<ProductType | null> {
    const found = await this.repo.findByPk(id);
    return found ? this.toDomain(found) : null;
  }

  async findByName(name: string): Promise<ProductType | null> {
    const found = await this.repo.findOne({ where: { name } });
    return found ? this.toDomain(found) : null;
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  private toDomain(m: ProductTypeModel): ProductType {
    return new ProductType({
      id: m.id,
      name: m.name,
      description: m.description ?? null,
      status: (m.status as ProductTypeStatus) ?? 'active',
    });
  }
}
