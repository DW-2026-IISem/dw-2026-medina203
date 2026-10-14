import { UpdateClientDto } from "./update-client.dto";

/** Datos de entrada de `PATCH /api/clientes/:id` (actualización parcial). */
export type PatchClientDto = Partial<UpdateClientDto>;
