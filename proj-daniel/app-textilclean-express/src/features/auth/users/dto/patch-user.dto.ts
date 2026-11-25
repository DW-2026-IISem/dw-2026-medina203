import { UpdateUserDto } from "./update-user.dto";

/** Datos de entrada de `PATCH /api/usuarios/:id`. */
export type PatchUserDto = Partial<UpdateUserDto>;