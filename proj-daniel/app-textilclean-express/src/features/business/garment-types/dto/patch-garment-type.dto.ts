import { UpdateGarmentTypeDto } from "./update-garment-type.dto";

/** Datos de entrada de `PATCH /api/tipos-prenda/:id`. */
export type PatchGarmentTypeDto = Partial<UpdateGarmentTypeDto>;
