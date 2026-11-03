import { Status, Timestamps } from './api.model';
import { HttpMethod } from './resource.model';

/** Pivote `resource_roles` — /api/concesiones-rol. Cada fila ES un permiso. */
export interface ResourceRole extends Timestamps {
  id: number;
  resource_id: number;
  role_id: number;
  status: Status;
  role?: { id: number; name: string } | null;
  resource?: {
    id: number;
    method: HttpMethod;
    path: string;
    description: string | null;
  } | null;
}
