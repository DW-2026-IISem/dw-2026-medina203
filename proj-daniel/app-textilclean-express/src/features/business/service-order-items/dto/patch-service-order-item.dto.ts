import { UpdateServiceOrderItemDto } from "./update-service-order-item.dto";

/** Datos de entrada de `PATCH /api/detalle-ordenes/:id`. */
export type PatchServiceOrderItemDto = Partial<UpdateServiceOrderItemDto>;
