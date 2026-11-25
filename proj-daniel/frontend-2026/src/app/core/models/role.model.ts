import { Status, Timestamps } from './api.model';

/** Tabla `roles` — /api/roles (ADMIN, OPERATOR…). */
export interface Role extends Timestamps {
  id: number;
  name: string;
  description: string | null;
  status: Status;
}

/** POST /api/roles. El backend guarda el nombre en MAYÚSCULAS. */
export interface RoleCreatePayload {
  name: string;
  description?: string | null;
  status?: Status;
}

/** PUT/PATCH /api/roles/:id — sin `status`. */
export type RoleUpdatePayload = Omit<RoleCreatePayload, 'status'>;
