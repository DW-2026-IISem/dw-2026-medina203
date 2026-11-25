/** Datos de entrada de `PATCH /api/usuarios/:id/password`. */
export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}