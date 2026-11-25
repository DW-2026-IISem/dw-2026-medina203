/**
 * Datos de entrada de `PUT /api/ordenes/:id`.
 *
 * No incluye `status`, `process_status` ni totales: el estado del proceso cambia
 * con `PATCH /api/ordenes/:id/estado`, la anulación con `/deactivate` y los
 * totales se recalculan solos. Las líneas se gestionan en `/api/detalle-ordenes`.
 */
export interface UpdateServiceOrderDto {
  received_at: string | Date;
  delivery_date: string | Date | null;
  notes: string | null;
  tax: number;
  discount: number;
}
