import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { ProductModel } from '../../../../products/infrastructure/persistence/models/product.model.js';
import { SaleModel } from './sale.model.js';

@Table({ tableName: 'product_sales', timestamps: true })
export class ProductSaleModel extends Model {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => SaleModel)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare saleId: number;

  @ForeignKey(() => ProductModel)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare productId: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare quantity: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  declare unitPrice: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  declare total: number;

  @BelongsTo(() => SaleModel)
  sale?: SaleModel;

  @BelongsTo(() => ProductModel)
  product?: ProductModel;
}
