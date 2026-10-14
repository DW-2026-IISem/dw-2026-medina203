import { CreationAttributes, Transaction } from "sequelize";
import { Sale, SaleI } from "./sale.model";

export class SalesRepository {
  public async findAllActive(): Promise<Sale[]> {
    return Sale.findAll({ where: { status: "active" } });
  }

  public async findById(id: number, transaction?: Transaction): Promise<Sale | null> {
    return Sale.findByPk(id, { transaction });
  }

  public async findByIdForUpdate(id: number, transaction: Transaction): Promise<Sale | null> {
    return Sale.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  }

  public async create(data: CreationAttributes<Sale>, transaction?: Transaction): Promise<Sale> {
    return Sale.create(data, { transaction });
  }

  public async update(
    sale: Sale,
    data: Partial<SaleI>,
    transaction?: Transaction
  ): Promise<Sale> {
    return sale.update(data, { transaction });
  }

  public async delete(sale: Sale, transaction?: Transaction): Promise<void> {
    await sale.destroy({ transaction });
  }
}