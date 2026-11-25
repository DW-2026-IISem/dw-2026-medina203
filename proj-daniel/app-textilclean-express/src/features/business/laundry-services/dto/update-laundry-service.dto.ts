import { BillingUnit } from "../laundry-service.model";

/** Datos de entrada de `PUT /api/servicios/:id` (sin `status`). */
export interface UpdateLaundryServiceDto {
  name: string;
  description?: string | null;
  price: number;
  billing_unit: BillingUnit;
  estimated_hours: number;
  garment_type_id: number;
}

export const LAUNDRY_SERVICE_EDITABLE_FIELDS = [
  "name",
  "description",
  "price",
  "billing_unit",
  "estimated_hours",
  "garment_type_id",
] as const;
