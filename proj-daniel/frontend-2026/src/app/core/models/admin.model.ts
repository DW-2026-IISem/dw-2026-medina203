import { HttpMethod } from './resource.model';
import { Status } from './api.model';

// Usuarios
export interface UserPayload {
  username: string;
  email: string;
  password?: string;
  avatar?: string | null;
  status?: Status;
}

// Roles
export interface RolePayload {
  name: string;
  description: string | null;
  status?: Status;
}

// Recursos
export interface ResourcePayload {
  path: string;
  method: HttpMethod;
  description: string | null;
  status?: Status;
}

// Asignaciones usuario-rol
export interface RoleUser {
  id: number;
  user_id: number;
  role_id: number;
  status: Status;
  created_at?: string;
}

export interface RoleUserPayload {
  user_id: number;
  role_id: number;
}

// Concesiones rol-recurso
export interface ResourceRole {
  id: number;
  role_id: number;
  resource_id: number;
  status: Status;
  created_at?: string;
}

export interface ResourceRolePayload {
  role_id: number;
  resource_id: number;
}
