import { Status, Timestamps } from './api.model';

/** Tabla `garment_types` — /api/tipos-prenda (sábanas, toallas, uniformes…). */
export interface GarmentType extends Timestamps {
  id: number;
  name: string;
  description: string | null;
  status: Status;
}

/** POST /api/tipos-prenda. */
export interface GarmentTypeCreatePayload {
  name: string;
  description?: string | null;
  status?: Status;
}

/** PUT/PATCH /api/tipos-prenda/:id — sin `status`. */
export type GarmentTypeUpdatePayload = Omit<GarmentTypeCreatePayload, 'status'>;
