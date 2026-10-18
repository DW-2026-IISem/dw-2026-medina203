"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundResponse = exports.invalidIdResponse = exports.forbiddenResponse = exports.unauthorizedResponse = exports.bearerSecurity = exports.openSecurity = exports.bearerSecurityScheme = void 0;
exports.bearerSecurityScheme = {
    bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token JWT enviado en Authorization: Bearer <access_token>.",
    },
};
exports.openSecurity = [];
exports.bearerSecurity = [{ bearerAuth: [] }];
exports.unauthorizedResponse = {
    description: "401 No autenticado: falta un Bearer token válido o expiró.",
};
exports.forbiddenResponse = {
    description: "403 Prohibido: no existe una concesión activa para esta operación.",
};
exports.invalidIdResponse = {
    description: "400 id inválido (debe ser un entero positivo)",
};
exports.notFoundResponse = { description: "404 No encontrado" };
//# sourceMappingURL=swagger-security.js.map