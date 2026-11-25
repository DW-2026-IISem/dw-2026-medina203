import { Money, Status, Timestamps } from './api.model';

/** Cómo se cobra un servicio: por kilogramo o por prenda. */
export type BillingUnit = 'kg' | 'unit';

export const BILLING_UNITS: Array<{ label: string; value: BillingUnit }> = [
  { label: 'Por kilogramo', value: 'kg' },
  { label: 'Por unidad', value: 'unit' },
];

/** Tabla `laundry_services` — /api/servicios. */
export interface LaundryService extends Timestamps {
  id: number;
  name: string;
  description: string | null;
  price: Money;
  billing_unit: BillingUnit;
  estimated_hours: number;
  garment_type_id: number;
  status: Status;
  /** Las lecturas del backend incluyen el tipo de prenda resumido. */
  garment_type?: { id: number; name: string };
}

/** POST /api/servicios. */
export interface LaundryServiceCreatePayload {
  name: string;
  description?: string | null;
  price: number;
  billing_unit: BillingUnit;
  estimated_hours?: number;
  garment_type_id: number;
  status?: Status;
}

/** PUT/PATCH /api/servicios/:id — sin `status`. */
export type LaundryServiceUpdatePayload = Omit<LaundryServiceCreatePayload, 'status'>;
