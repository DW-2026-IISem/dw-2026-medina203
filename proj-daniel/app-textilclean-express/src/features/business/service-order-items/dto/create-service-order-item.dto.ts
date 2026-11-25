/** Datos de entrada de `POST /api/detalle-ordenes` (agrega una línea a una orden existente). */
export interface CreateServiceOrderItemDto {
  service_order_id: number;
  laundry_service_id: number;
  quantity: number;
  /** Obligatorio si el servicio se cobra por kg. */
  weight_kg?: number | null;
}
