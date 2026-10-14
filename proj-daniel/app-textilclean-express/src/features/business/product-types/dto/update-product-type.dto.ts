/**
 * Datos de entrada de `PUT /api/tipos-producto/:id` (reemplazo completo).
 *
 * `status` **no** está aquí a propósito: el estado sólo cambia con el borrado
 * lógico (`PATCH /api/tipos-producto/:id/deactivate`).
 */
export interface UpdateProductTypeDto {
  name: string;
  description?: string | null;
}
