import { Status, Timestamps } from './api.model';
import { HttpMethod } from './resource.model';

/** Pivote `resource_roles` — /api/concesiones-rol. Cada fila activa ES un permiso. */
export interface ResourceRole extends Timestamps {
  id: number;
  role_id: number;
  resource_id: number;
  status: Status;
  role?: { id: number; name: string } | null;
  resource?: { id: number; method: HttpMethod; path: string; description: string | null } | null;
}

/** POST /api/concesiones-rol. */
export interface ResourceRolePayload {
  role_id: number;
  resource_id: number;
}
