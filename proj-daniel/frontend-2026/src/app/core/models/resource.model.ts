import { Status, Timestamps } from './api.model';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

/** Tabla `resources` — /api/recursos (catálogo de 58 pares method+path). */
export interface Resource extends Timestamps {
  id: number;
  path: string;
  method: HttpMethod;
  description: string | null;
  status: Status;
}

/** POST /api/recursos — CreateResourceDto. */
export interface ResourceCreatePayload {
  method: HttpMethod;
  path: string;
  description?: string | null;
  status?: Status;
}

/** PUT/PATCH /api/recursos/:id — UpdateResourceDto: sin `status`. */
export interface ResourceUpdatePayload {
  method: HttpMethod;
  path: string;
  description?: string | null;
}
