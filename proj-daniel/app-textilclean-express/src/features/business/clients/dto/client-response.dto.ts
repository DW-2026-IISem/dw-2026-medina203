import { Client, ClientI } from "../client.model";

/**
 * Respuesta HTTP de un cliente. Lo usan `GET /api/clientes`,
 * `GET /api/clientes/:id` y la salida de create/update/delete lógico.
 *
 * Regla del DTO de respuesta: la API expone **sólo** lo que declara este tipo y
 * `password` nunca sale. La proyección es explícita (`Omit`) porque hay algo que
 * ocultar; en las entidades que no tienen campos internos el DTO coincide con el
 * modelo y basta con documentarlo.
 */
export type ClientResponseDto = Omit<ClientI, "password">;

/** Mapper modelo -> DTO de respuesta (objeto plano; elimina `password`). */
export function toClientResponse(client: Client): ClientResponseDto {
  const { password, ...safe } = client.toJSON() as ClientI & { password?: string };
  return safe;
}
