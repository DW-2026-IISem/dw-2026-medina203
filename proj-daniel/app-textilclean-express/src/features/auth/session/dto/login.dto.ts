/** `POST /api/sesion/login`: `identifier` acepta username o email. */
export interface LoginDto {
  identifier: string;
  password: string;
}