/** Datos de entrada de `POST /api/tipos-producto`. */
export interface CreateProductTypeDto {
  name: string;
  description?: string | null;
  /** Opcional: por defecto `active`. Tras crearlo, el estado sólo cambia con el borrado lógico. */
  status?: "active" | "inactive";
}
