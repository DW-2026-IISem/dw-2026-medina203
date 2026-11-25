/**
 * Error de aplicación con código HTTP asociado.
 *
 * Lo lanzan los **services** y los middlewares de acceso (capa de negocio) cuando una regla no se cumple
 * (no encontrado, estado inválido, orden ya entregada, etc.).
 * Los **controllers** lo traducen a una respuesta HTTP.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  public constructor(statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
