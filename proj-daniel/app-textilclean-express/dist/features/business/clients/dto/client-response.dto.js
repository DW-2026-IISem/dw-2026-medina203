"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toClientResponse = toClientResponse;
/** Mapper modelo -> DTO de respuesta (objeto plano; elimina `password`). */
function toClientResponse(client) {
    const { password, ...safe } = client.toJSON();
    return safe;
}
//# sourceMappingURL=client-response.dto.js.map