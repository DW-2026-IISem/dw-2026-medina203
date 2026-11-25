import { ProcessStatus } from "../service-order.model";

/** Datos de entrada de `PATCH /api/ordenes/:id/estado`. */
export interface ChangeProcessStatusDto {
  process_status: ProcessStatus;
}
