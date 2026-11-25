import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

/**
 * Tipo de prenda que procesa la lavandería (sábanas, toallas, uniformes…).
 * Tabla: `garment_types`.
 */
export interface GarmentTypeI {
  id?: number;
  name: string;
  description?: string | null;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class GarmentType extends Model {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

GarmentType.init(
  {
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: "uq_garment_types_name",
      validate: { notEmpty: { msg: "name cannot be empty" } },
    },
    description: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  { sequelize, modelName: "GarmentType", tableName: "garment_types", timestamps: true }
);
