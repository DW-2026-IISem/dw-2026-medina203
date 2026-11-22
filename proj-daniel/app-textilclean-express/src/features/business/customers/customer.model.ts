import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

/**
 * Empresa cliente de TextilClean (hotel, clínica, restaurante, gimnasio…).
 * Tabla: `customers`.
 */
export interface CustomerI {
  id?: number;
  business_name: string;
  tax_id: string;
  contact_name?: string | null;
  phone: string;
  email: string;
  address?: string | null;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class Customer extends Model {
  public id!: number;
  public business_name!: string;
  public tax_id!: string;
  public contact_name!: string | null;
  public phone!: string;
  public email!: string;
  public address!: string | null;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Customer.init(
  {
    business_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: { msg: "business_name cannot be empty" } },
    },
    tax_id: {
      // NIT colombiano, ej. 900123456-7
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "uq_customers_tax_id",
      validate: {
        notEmpty: { msg: "tax_id cannot be empty" },
        is: { args: /^[0-9]{5,15}(-[0-9])?$/, msg: "tax_id must be a valid NIT (e.g. 900123456-7)" },
      },
    },
    contact_name: { type: DataTypes.STRING(120), allowNull: true },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: { notEmpty: { msg: "phone cannot be empty" } },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: "uq_customers_email",
      validate: { isEmail: { msg: "email must be a valid email address" } },
    },
    address: { type: DataTypes.STRING(200), allowNull: true },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      // Fail-safe: una fila insertada sin estado explícito NO queda visible en la API.
      // La creación por API siempre envía "active".
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  { sequelize, modelName: "Customer", tableName: "customers", timestamps: true }
);
