import { UpdateCustomerDto } from "./update-customer.dto";

/** Datos de entrada de `PATCH /api/clientes/:id` (actualización parcial). */
export type PatchCustomerDto = Partial<UpdateCustomerDto>;
