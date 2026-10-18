"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
/**
 * Error de aplicación con código HTTP asociado.
 *
 * Lo lanzan los **services** (capa de negocio) cuando una regla no se cumple
 * (no encontrado, estado inválido, stock insuficiente, etc.).
 * Los **controllers** lo traducen a una respuesta HTTP.
 */
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
//# sourceMappingURL=app-error.js.map