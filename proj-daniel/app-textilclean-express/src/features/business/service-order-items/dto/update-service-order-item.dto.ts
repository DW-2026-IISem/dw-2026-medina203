/**
 * Datos de entrada de `PUT /api/detalle-ordenes/:id`.
 * Solo cambian cantidad y peso; el servicio, el precio congelado y `status` no.
 */
export interface UpdateServiceOrderItemDto {
  quantity: number;
  weight_kg?: number | null;
}
