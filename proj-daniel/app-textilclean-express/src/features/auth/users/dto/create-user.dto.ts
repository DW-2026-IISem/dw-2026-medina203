/** Datos de entrada de `POST /api/usuarios`. */
export interface CreateUserDto {
  username: string;
  full_name?: string | null;
  email: string;
  password: string;
  avatar?: string | null;
  status?: "active" | "inactive";
}