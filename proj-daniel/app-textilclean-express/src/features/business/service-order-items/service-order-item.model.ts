import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

/**
 * Línea de una orden de servicio. Tabla: `service_order_items`.
 *
 * - `unit_price` es una **copia** del precio del servicio al momento de crear la
 *   línea: si el precio cambia después, la orden no se altera.
 * - `line_total` = `unit_price × weight_kg` (cobro por kg) o
 *   `unit_price × quantity` (cobro por unidad).
 */
export interface ServiceOrderItemI {
  id?: number;
  service_order_id: number;
  laundry_service_id: number;
  quantity: number;
  weight_kg: number | null;
  unit_price: number;
  line_total: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class ServiceOrderItem extends Model {
  public id!: number;
  public service_order_id!: number;
  public laundry_service_id!: number;
  public quantity!: number;
  public weight_kg!: number | null;
  public unit_price!: number;
  public line_total!: number;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ServiceOrderItem.init(
  {
    service_order_id: { type: DataTypes.INTEGER, allowNull: false },
    laundry_service_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    weight_kg: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    line_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  { sequelize, modelName: "ServiceOrderItem", tableName: "service_order_items", timestamps: true }
);
