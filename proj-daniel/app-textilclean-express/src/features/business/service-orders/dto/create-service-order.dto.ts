/** Línea enviada al crear una orden. */
export interface CreateServiceOrderLineDto {
  laundry_service_id: number;
  /** Número de prendas (entero ≥ 1). */
  quantity: number;
  /** Peso en kg; obligatorio si el servicio se cobra por kg. */
  weight_kg?: number | null;
}

/** Datos de entrada de `POST /api/ordenes` (orden + líneas en una transacción). */
export interface CreateServiceOrderDto {
  customer_id: number;
  /** Por defecto: ahora. */
  received_at?: string | Date;
  /** Por defecto: received_at + mayor `estimated_hours` de los servicios. */
  delivery_date?: string | Date | null;
  notes?: string | null;
  tax?: number;
  discount?: number;
  items: CreateServiceOrderLineDto[];
}
