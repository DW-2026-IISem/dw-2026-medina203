import { CreationAttributes, Transaction } from "sequelize";
import { Product, ProductI } from "./product.model";

export class ProductsRepository {
  public async findAllActive(): Promise<Product[]> {
    return Product.findAll({ where: { status: "active" } });
  }

  public async findById(id: number, transaction?: Transaction): Promise<Product | null> {
    return Product.findByPk(id, { transaction });
  }

  public async findByIdForUpdate(id: number, transaction: Transaction): Promise<Product | null> {
    return Product.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  }

  public async create(data: CreationAttributes<Product>): Promise<Product> {
    return Product.create(data);
  }

  public async update(
    product: Product,
    data: Partial<ProductI>,
    transaction?: Transaction
  ): Promise<Product> {
    return product.update(data, { transaction });
  }

  public async delete(product: Product): Promise<void> {
    await product.destroy();
  }
}