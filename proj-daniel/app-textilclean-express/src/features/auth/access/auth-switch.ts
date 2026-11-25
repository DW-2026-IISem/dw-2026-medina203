/**
 * Interruptor del modo práctica.
 *
 * `AUTH_ENABLED=false` desactiva authenticate y authorize para poder demostrar
 * la Fase I sin sesión. Cualquier otro valor (o no definirlo) deja la
 * seguridad ACTIVA: secure by default.
 */
export function isAuthEnabled(): boolean {
  return process.env.AUTH_ENABLED !== "false";
}
