/** Datos de entrada de `PUT /api/tipos-prenda/:id` (sin `status`). */
export interface UpdateGarmentTypeDto {
  name: string;
  description?: string | null;
}

export const GARMENT_TYPE_EDITABLE_FIELDS = ["name", "description"] as const;
