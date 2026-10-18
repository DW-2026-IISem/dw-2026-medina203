"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionSwagger = void 0;
const swagger_security_1 = require("../../../shared/http/swagger-security");
exports.sessionSwagger = {
    tags: [{ name: "Sesión", description: "Login, renovación, cierre, perfil y permisos (OPEN + JWT)" }],
    paths: {
        "/api/sesion/login": {
            post: {
                tags: ["Sesión"], summary: "Iniciar sesión", security: swagger_security_1.openSecurity,
                description: "Valida username/correo y contraseña. Las credenciales incorrectas siempre reciben el mismo 401.",
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Login" } } } },
                responses: { "200": { description: "Access y refresh tokens" }, "400": { description: "Faltan credenciales" }, "401": { description: "Credenciales inválidas" } },
            },
        },
        "/api/sesion/refresh": {
            post: {
                tags: ["Sesión"], summary: "Renovar tokens", security: swagger_security_1.openSecurity,
                description: "Rota el refresh token; reutilizar uno anterior revoca la familia completa.",
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshSession" } } } },
                responses: { "200": { description: "Tokens nuevos" }, "400": { description: "Falta refresh_token" }, "401": { description: "Token inválido, expirado o reutilizado" } },
            },
        },
        "/api/sesion/logout": {
            post: {
                tags: ["Sesión"], summary: "Cerrar sesión", security: swagger_security_1.openSecurity,
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshSession" } } } },
                responses: { "200": { description: "Sesión cerrada" }, "400": { description: "Falta refresh_token" } },
            },
        },
        "/api/sesion/perfil": {
            get: { tags: ["Sesión"], summary: "Perfil del usuario autenticado", security: swagger_security_1.bearerSecurity, responses: { "200": { description: "Perfil sin contraseña" }, "401": swagger_security_1.unauthorizedResponse } },
        },
        "/api/permisos": {
            get: { tags: ["Sesión"], summary: "Consultar permisos efectivos propios", security: swagger_security_1.bearerSecurity, responses: { "200": { description: "Permisos efectivos" }, "401": swagger_security_1.unauthorizedResponse } },
        },
    },
    components: { schemas: {
            Login: { type: "object", required: ["identifier", "password"], properties: { identifier: { type: "string", description: "Username o email" }, password: { type: "string", format: "password" } } },
            RefreshSession: { type: "object", required: ["refresh_token"], properties: { refresh_token: { type: "string" } } },
            SessionTokens: { type: "object", properties: { access_token: { type: "string" }, token_type: { type: "string", enum: ["Bearer"] }, expires_in: { type: "integer" }, refresh_token: { type: "string" }, refresh_expires_in: { type: "integer" } } },
        } },
};
//# sourceMappingURL=session.swagger.js.map