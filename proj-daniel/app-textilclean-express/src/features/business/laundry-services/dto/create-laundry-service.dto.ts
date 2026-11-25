import { BillingUnit } from "../laundry-service.model";

/** Datos de entrada de `POST /api/servicios`. */
export interface CreateLaundryServiceDto {
  name: string;
  description?: string | null;
  price: number;
  billing_unit: BillingUnit;
  /** Opcional: por defecto 24 horas. */
  estimated_hours?: number;
  garment_type_id: number;
  status?: "active" | "inactive";
}
