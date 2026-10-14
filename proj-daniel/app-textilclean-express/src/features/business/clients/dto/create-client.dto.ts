/** Datos de entrada de `POST /api/clientes`. */
export interface CreateClientDto {
  name: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  /** Opcional: por defecto `active`. Tras crearlo, el estado sólo cambia con el borrado lógico. */
  status?: "active" | "inactive";
}
