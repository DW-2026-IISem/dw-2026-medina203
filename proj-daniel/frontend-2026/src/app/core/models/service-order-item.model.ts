import { Money, Status, Timestamps } from './api.model';
import { BillingUnit } from './laundry-service.model';

/**
 * Tabla `service_order_items` — /api/detalle-ordenes.
 * `unit_price` es el precio congelado al crear la línea; `line_total` lo calcula el backend.
 */
export interface ServiceOrderItem extends Timestamps {
  id: number;
  service_order_id: number;
  laundry_service_id: number;
  quantity: number;
  weight_kg: Money | null;
  unit_price: Money;
  line_total: Money;
  status: Status;
  laundry_service?: { id: number; name: string; billing_unit: BillingUnit };
}

/** POST /api/detalle-ordenes: agrega una línea a una orden existente. */
export interface ServiceOrderItemCreatePayload {
  service_order_id: number;
  laundry_service_id: number;
  quantity: number;
  /** Obligatorio si el servicio se cobra por kg. */
  weight_kg?: number | null;
}

/** PUT/PATCH /api/detalle-ordenes/:id: solo cantidad y peso. */
export interface ServiceOrderItemUpdatePayload {
  quantity?: number;
  weight_kg?: number | null;
}
