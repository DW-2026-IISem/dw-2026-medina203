import { Status, Timestamps } from './api.model';

/** Tabla `clients` — /api/clientes */
export interface Client extends Timestamps {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: Status;
}

export interface ClientPayload {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status?: Status;
}

/** POST /api/clientes — CreateClientDto: `password` es obligatorio. */
export interface ClientCreatePayload {
  name: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  status?: Status;
}

/**
 * PUT /api/clientes/:id — UpdateClientDto (reemplazo completo).
 * `status` queda fuera a propósito: el estado sólo cambia con /deactivate.
 * PATCH /:id usa Partial<ClientUpdatePayload>.
 */
export interface ClientUpdatePayload {
  name: string;
  address: string;
  phone: string;
  email: string;
  /** Si no se envía, el backend conserva el hash actual. */
  password?: string;
}
