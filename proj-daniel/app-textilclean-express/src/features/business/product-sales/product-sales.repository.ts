import { CreationAttributes, Transaction } from "sequelize";
import { ProductSale, ProductSaleI } from "./product-sale.model";

export class ProductSalesRepository {
  public async findAllActive(): Promise<ProductSale[]> {
    return ProductSale.findAll({ where: { status: "active" } });
  }

  public async findById(id: number, transaction?: Transaction): Promise<ProductSale | null> {
    return ProductSale.findByPk(id, { transaction });
  }

  public async findByIdForUpdate(id: number, transaction: Transaction): Promise<ProductSale | null> {
    return ProductSale.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  }

  public async findActiveBySaleId(saleId: number, transaction?: Transaction): Promise<ProductSale[]> {
    return ProductSale.findAll({
      where: { sale_id: saleId, status: "active" },
      transaction,
    });
  }

  public async create(
    data: CreationAttributes<ProductSale>,
    transaction?: Transaction
  ): Promise<ProductSale> {
    return ProductSale.create(data, { transaction });
  }

  public async update(
    productSale: ProductSale,
    data: Partial<ProductSaleI>,
    transaction?: Transaction
  ): Promise<ProductSale> {
    return productSale.update(data, { transaction });
  }

  public async delete(productSale: ProductSale, transaction?: Transaction): Promise<void> {
    await productSale.destroy({ transaction });
  }

  public async deleteBySaleId(saleId: number, transaction?: Transaction): Promise<number> {
    return ProductSale.destroy({ where: { sale_id: saleId }, transaction });
  }

  public async deactivateBySaleId(saleId: number, transaction?: Transaction): Promise<number> {
    const [affected] = await ProductSale.update(
      { status: "inactive" },
      { where: { sale_id: saleId, status: "active" }, transaction }
    );
    return affected;
  }
}