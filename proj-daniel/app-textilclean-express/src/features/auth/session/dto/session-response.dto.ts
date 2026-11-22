/** Respuesta de login y refresh. */
export interface SessionTokensDto {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

/** Perfil del usuario autenticado, con sus roles activos (para la UI). */
export interface ProfileDto {
  id: number;
  username: string;
  full_name: string | null;
  email: string;
  avatar: string | null;
  status: "active" | "inactive";
  roles: string[];
}