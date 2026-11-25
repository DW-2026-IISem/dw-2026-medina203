/**
 * Datos de entrada de `PUT /api/clientes/:id` (reemplazo completo).
 *
 * `status` no está aquí a propósito: el estado solo cambia con el borrado
 * lógico (`PATCH /api/clientes/:id/deactivate`).
 */
export interface UpdateCustomerDto {
  business_name: string;
  tax_id: string;
  contact_name?: string | null;
  phone: string;
  email: string;
  address?: string | null;
}

/** Campos editables por PUT/PATCH (whitelist usada por el service). */
export const CUSTOMER_EDITABLE_FIELDS = [
  "business_name",
  "tax_id",
  "contact_name",
  "phone",
  "email",
  "address",
] as const;
