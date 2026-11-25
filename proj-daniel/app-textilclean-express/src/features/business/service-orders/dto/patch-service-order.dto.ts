import { UpdateServiceOrderDto } from "./update-service-order.dto";

/** Datos de entrada de `PATCH /api/ordenes/:id`. */
export type PatchServiceOrderDto = Partial<UpdateServiceOrderDto>;
