import { UpdateLaundryServiceDto } from "./update-laundry-service.dto";

/** Datos de entrada de `PATCH /api/servicios/:id`. */
export type PatchLaundryServiceDto = Partial<UpdateLaundryServiceDto>;
