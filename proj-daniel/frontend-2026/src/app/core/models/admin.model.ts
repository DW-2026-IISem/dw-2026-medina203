import { Status } from './api.model';
import { ResourceCreatePayload } from './resource.model';
import { RoleCreatePayload } from './role.model';

export type {
  ResourceRole,
  ResourceRolePayload,
  RoleGrantReconciliation,
  RoleGrantReconciliationPayload,
} from './resource-role.model';
export type { RoleUser, RoleUserPayload } from './role-user.model';

/**
 * Payload que emite el formulario de usuarios (ISS-10).
 * En creación incluye `password` y `status`; en edición, solo identidad.
 */
export interface UserPayload {
  username: string;
  full_name: string | null;
  email: string;
  avatar?: string | null;
  password?: string;
  status?: Status;
}

export type RolePayload = RoleCreatePayload;
export type ResourcePayload = ResourceCreatePayload;
