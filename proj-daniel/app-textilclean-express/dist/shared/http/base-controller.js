"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
const app_error_1 = require("../errors/app-error");
const error_response_1 = require("./error-response");
/**
 * Base de los controllers HTTP.
 *
 * Aísla las tres responsabilidades puramente HTTP que, si no, se repetirían en
 * los 7 métodos de cada controller:
 *
 *  - `run`:            ejecuta el cuerpo del handler y traduce el error a HTTP.
 *  - `paramId`:        lee y valida el `:id` de la URL.
 *  - `handleError`:    mapea `AppError` a su status y lo demás a 500.
 *
 * La capa de negocio (service) no conoce `req`/`res`.
 */
class BaseController {
    /**
     * Ejecuta el cuerpo de un handler y centraliza el manejo de errores.
     *
     * Sin este helper, cada uno de los 35 métodos de los controllers tendría su
     * propio `try/catch`. Aquí el `catch` vive una sola vez.
     */
    async run(res, work) {
        try {
            await work();
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    /**
     * Lee el `:id` de la URL y lo valida como entero positivo.
     *
     * Sin la validación, `GET /api/clientes/abc` llegaría al repository como
     * `Number("abc") === NaN` y devolvería un 404 engañoso en vez de un 400.
     */
    paramId(req) {
        const raw = req.params.id;
        const value = Array.isArray(raw) ? raw[0] : raw;
        if (!value || !/^\d+$/.test(value) || Number(value) < 1) {
            throw new app_error_1.AppError(400, "Invalid id: must be a positive integer");
        }
        return Number(value);
    }
    /** Mapea errores: `AppError` -> su status; cualquier otro -> 500. */
    handleError(res, error) {
        (0, error_response_1.sendError)(res, error);
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=base-controller.js.map