import { Status, Timestamps } from './api.model';

/** Tabla `users` — /api/usuarios. Las respuestas nunca traen `password`. */
export interface User extends Timestamps {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  status: Status;
}

/** POST /api/usuarios — CreateUserDto. */
export interface UserCreatePayload {
  username: string;
  email: string;
  password: string;
  avatar?: string | null;
  status?: Status;
}

/** PUT /api/usuarios/:id — UpdateUserDto: sin password ni status. */
export interface UserUpdatePayload {
  username: string;
  email: string;
  avatar?: string | null;
}

/** PATCH /api/usuarios/:id/password — ChangePasswordDto. */
export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}
