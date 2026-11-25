/** Datos de entrada de `POST /api/clientes`. */
export interface CreateCustomerDto {
  business_name: string;
  tax_id: string;
  contact_name?: string | null;
  phone: string;
  email: string;
  address?: string | null;
  /** Opcional: por defecto `active`. Después solo cambia con el borrado lógico. */
  status?: "active" | "inactive";
}
