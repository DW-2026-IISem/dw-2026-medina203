import { Status, Timestamps } from './api.model';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

/** Tabla `resources` — /api/recursos: catálogo de operaciones `METHOD /ruta`. */
export interface Resource extends Timestamps {
  id: number;
  method: HttpMethod;
  path: string;
  description: string | null;
  status: Status;
}

/** POST /api/recursos. */
export interface ResourceCreatePayload {
  method: HttpMethod;
  path: string;
  description?: string | null;
  status?: Status;
}

/** PUT/PATCH /api/recursos/:id — sin `status`. */
export type ResourceUpdatePayload = Omit<ResourceCreatePayload, 'status'>;
