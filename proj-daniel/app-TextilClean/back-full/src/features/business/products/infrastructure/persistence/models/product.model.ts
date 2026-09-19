import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { ProductTypeModel } from '../../../../product-types/infrastructure/persistence/models/product-type.model.js';

@Table({ tableName: 'products', timestamps: true })
export class ProductModel extends Model {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare brand: string | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  declare price: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  declare minStock: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  declare quantity: number;

  @ForeignKey(() => ProductTypeModel)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare productTypeId: number;

  @BelongsTo(() => ProductTypeModel)
  productType?: ProductTypeModel;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'active' })
  declare status: string;
}
