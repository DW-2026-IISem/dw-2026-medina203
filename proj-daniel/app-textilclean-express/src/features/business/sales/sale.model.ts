import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface SaleI {
  id?: number;
  sale_date: Date | string;
  subtotal: number;
  tax: number;
  discounts: number;
  total: number;
  client_id: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class Sale extends Model {
  public id!: number;
  public sale_date!: Date;
  public subtotal!: number;
  public tax!: number;
  public discounts!: number;
  public total!: number;
  public client_id!: number;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Sale.init(
  {
    sale_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    tax: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    discounts: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    client_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  { sequelize, modelName: "Sale", tableName: "sales", timestamps: true }
);