import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface ProductSaleI {
  id?: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductSale extends Model {
  public id!: number;
  public sale_id!: number;
  public product_id!: number;
  public quantity!: number;
  public unit_price!: number;
  public line_total!: number;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductSale.init(
  {
    sale_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    line_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  { sequelize, modelName: "ProductSale", tableName: "product_sales", timestamps: true }
);