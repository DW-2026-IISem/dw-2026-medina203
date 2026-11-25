import { Status, Timestamps } from './api.model';

/** Tabla `customers` — /api/clientes. Empresa cliente de la lavandería. */
export interface Customer extends Timestamps {
  id: number;
  business_name: string;
  /** NIT, ej. 900123456-7 (único). */
  tax_id: string;
  contact_name: string | null;
  phone: string;
  email: string;
  address: string | null;
  status: Status;
}

/** POST /api/clientes. `status` es opcional (por defecto `active`). */
export interface CustomerCreatePayload {
  business_name: string;
  tax_id: string;
  contact_name?: string | null;
  phone: string;
  email: string;
  address?: string | null;
  status?: Status;
}

/** PUT/PATCH /api/clientes/:id — sin `status` (solo cambia con /deactivate). */
export type CustomerUpdatePayload = Omit<CustomerCreatePayload, 'status'>;
