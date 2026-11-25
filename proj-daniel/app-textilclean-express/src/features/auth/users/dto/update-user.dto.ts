/**
 * Datos de entrada de `PUT /api/usuarios/:id`.
 * Sin `password` (va por `/password`) ni `status` (va por `/deactivate`).
 */
export interface UpdateUserDto {
  username: string;
  full_name?: string | null;
  email: string;
  avatar?: string | null;
}