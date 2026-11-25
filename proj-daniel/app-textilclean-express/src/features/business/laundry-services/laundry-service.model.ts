import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export type BillingUnit = "kg" | "unit";

/**
 * Servicio que ofrece la lavandería sobre un tipo de prenda
 * (lavado, secado, planchado, desmanchado…). Tabla: `laundry_services`.
 *
 * `billing_unit` define cómo se cobra en la orden:
 *  - `kg`:   precio × peso en kilogramos
 *  - `unit`: precio × cantidad de prendas
 */
export interface LaundryServiceI {
  id?: number;
  name: string;
  description?: string | null;
  price: number;
  billing_unit: BillingUnit;
  estimated_hours: number;
  garment_type_id: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class LaundryService extends Model {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public price!: number;
  public billing_unit!: BillingUnit;
  public estimated_hours!: number;
  public garment_type_id!: number;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LaundryService.init(
  {
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: { msg: "name cannot be empty" } },
    },
    description: { type: DataTypes.STRING(255), allowNull: true },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: "price must be a number" },
        min: { args: [0], msg: "price must be greater than or equal to 0" },
      },
    },
    billing_unit: {
      type: DataTypes.ENUM("kg", "unit"),
      allowNull: false,
      defaultValue: "kg",
      validate: { isIn: { args: [["kg", "unit"]], msg: "billing_unit must be 'kg' or 'unit'" } },
    },
    estimated_hours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 24,
      validate: {
        isInt: { msg: "estimated_hours must be an integer" },
        min: { args: [1], msg: "estimated_hours must be at least 1" },
      },
    },
    garment_type_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  { sequelize, modelName: "LaundryService", tableName: "laundry_services", timestamps: true }
);
