import { Status, Timestamps } from './api.model';

/** Tabla `roles` — /api/roles */
export interface Role extends Timestamps {
  id: number;
  name: string;
  description: string | null;
  status: Status;
}

/** POST /api/roles — CreateRoleDto. */
export interface RoleCreatePayload {
  name: string;
  description?: string | null;
  status?: Status;
}

/** PUT/PATCH /api/roles/:id — UpdateRoleDto: sin `status`. */
export interface RoleUpdatePayload {
  name: string;
  description?: string | null;
}
