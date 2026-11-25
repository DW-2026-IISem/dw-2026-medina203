import { Status, Timestamps } from './api.model';

/** Tabla `users` — /api/usuarios. Personal de la lavandería. Nunca trae `password`. */
export interface User extends Timestamps {
  id: number;
  username: string;
  full_name: string | null;
  email: string;
  avatar: string | null;
  status: Status;
  /** Solo en GET /api/sesion/perfil: nombres de los roles activos. */
  roles?: string[];
}

/** POST /api/usuarios. */
export interface UserCreatePayload {
  username: string;
  full_name?: string | null;
  email: string;
  password: string;
  avatar?: string | null;
  status?: Status;
}

/** PUT/PATCH /api/usuarios/:id: sin password ni status. */
export interface UserUpdatePayload {
  username?: string;
  full_name?: string | null;
  email?: string;
  avatar?: string | null;
}

/** PATCH /api/usuarios/:id/password. */
export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}
