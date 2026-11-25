/** Datos de entrada de `POST /api/tipos-prenda`. */
export interface CreateGarmentTypeDto {
  name: string;
  description?: string | null;
  /** Opcional: por defecto `active`. */
  status?: "active" | "inactive";
}
