import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

/**
 * Estado del proceso de lavandería. Solo avanza hacia adelante:
 * received → in_process → ready → delivered
 */
export const PROCESS_STATUSES = ["received", "in_process", "ready", "delivered"] as const;
export type ProcessStatus = (typeof PROCESS_STATUSES)[number];

/**
 * Orden de servicio: lo que una empresa cliente entrega para lavar.
 * Tabla: `service_orders`. Sus líneas viven en `service_order_items`.
 *
 * `status` (active/inactive) es el borrado lógico (anulación);
 * `process_status` es el avance operativo de la orden.
 */
export interface ServiceOrderI {
  id?: number;
  customer_id: number;
  received_at: Date;
  delivery_date: Date | null;
  process_status: ProcessStatus;
  notes?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class ServiceOrder extends Model {
  public id!: number;
  public customer_id!: number;
  public received_at!: Date;
  public delivery_date!: Date | null;
  public process_status!: ProcessStatus;
  public notes!: string | null;
  public subtotal!: number;
  public tax!: number;
  public discount!: number;
  public total!: number;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ServiceOrder.init(
  {
    customer_id: { type: DataTypes.INTEGER, allowNull: false },
    received_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    delivery_date: { type: DataTypes.DATE, allowNull: true },
    process_status: {
      type: DataTypes.ENUM(...PROCESS_STATUSES),
      allowNull: false,
      defaultValue: "received",
    },
    notes: { type: DataTypes.STRING(500), allowNull: true },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    tax: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  { sequelize, modelName: "ServiceOrder", tableName: "service_orders", timestamps: true }
);
