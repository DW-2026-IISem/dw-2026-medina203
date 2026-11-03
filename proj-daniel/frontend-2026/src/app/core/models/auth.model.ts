import { HttpMethod } from './resource.model';
import { User } from './user.model';

/** POST /api/sesion/login — `identifier` acepta username o email. */
export interface LoginRequest {
  identifier: string;
  password: string;
}

/** Respuesta de login y refresh: SOLO el par de tokens. */
export interface SessionTokens {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

/** GET /api/sesion/perfil */
export interface ProfilePayload {
  user: User;
}

/** Una fila de role_users → roles → resource_roles → resources (todo activo). */
export interface EffectivePermission {
  resource_id: number;
  method: HttpMethod;
  path: string;
  description: string | null;
  role_id: number;
  role_name: string;
}

/** GET /api/permisos · GET /api/usuarios/:id/permisos */
export interface PermissionsPayload {
  permissions: EffectivePermission[];
}

/** Estado compuesto que mantiene SessionStore. */
export interface AccessPayload {
  user: User;
  permissions: EffectivePermission[];
}
