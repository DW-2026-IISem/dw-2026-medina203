import { HttpMethod } from './resource.model';

/** Respuesta de POST /api/sesion/login y /api/sesion/refresh. */
export interface SessionTokens {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

/** Fila de GET /api/sesion/permisos: un permiso efectivo del usuario. */
export interface EffectivePermission {
  resource_id: number;
  method: HttpMethod;
  path: string;
  description: string | null;
  role_id: number;
  role_name: string;
}
