"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesSwagger = void 0;
const swagger_security_1 = require("../../../shared/http/swagger-security");
const id = [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }];
const auth = { "401": swagger_security_1.unauthorizedResponse, "403": swagger_security_1.forbiddenResponse };
exports.rolesSwagger = {
    tags: [{ name: "Roles", description: "Roles de autorización (JWT + RBAC)" }],
    paths: {
        "/api/roles": {
            get: { tags: ["Roles"], summary: "Listar roles activos", security: swagger_security_1.bearerSecurity, responses: { "200": { description: "Roles" }, ...auth } },
            post: { tags: ["Roles"], summary: "Crear rol", security: swagger_security_1.bearerSecurity, requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RoleCreate" } } } }, responses: { "201": { description: "Creado" }, "409": { description: "Nombre duplicado" }, ...auth } },
        },
        "/api/roles/{id}": {
            get: { tags: ["Roles"], summary: "Consultar rol", security: swagger_security_1.bearerSecurity, parameters: id, responses: { "200": { description: "Rol" }, "400": swagger_security_1.invalidIdResponse, "404": swagger_security_1.notFoundResponse, ...auth } },
            put: { tags: ["Roles"], summary: "Reemplazar rol", security: swagger_security_1.bearerSecurity, parameters: id, requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RoleUpdate" } } } }, responses: { "200": { description: "Actualizado" }, "400": swagger_security_1.invalidIdResponse, "404": swagger_security_1.notFoundResponse, "409": { description: "Nombre duplicado" }, ...auth } },
            patch: { tags: ["Roles"], summary: "Actualizar rol", security: swagger_security_1.bearerSecurity, parameters: id, requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/RolePatch" } } } }, responses: { "200": { description: "Actualizado" }, "400": swagger_security_1.invalidIdResponse, "404": swagger_security_1.notFoundResponse, ...auth } },
            delete: { tags: ["Roles"], summary: "Eliminar rol físicamente", security: swagger_security_1.bearerSecurity, parameters: id, responses: { "200": { description: "Eliminado" }, "404": swagger_security_1.notFoundResponse, ...auth } },
        },
        "/api/roles/{id}/deactivate": {
            patch: { tags: ["Roles"], summary: "Desactivar rol", security: swagger_security_1.bearerSecurity, parameters: id, responses: { "200": { description: "Desactivado" }, "404": swagger_security_1.notFoundResponse, ...auth } },
        },
    },
    components: { schemas: {
            Role: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, description: { type: "string", nullable: true }, status: { type: "string", enum: ["active", "inactive"] } } },
            RoleCreate: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string", nullable: true }, status: { type: "string", enum: ["active", "inactive"] } } },
            RoleUpdate: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string", nullable: true } } },
            RolePatch: { type: "object", properties: { name: { type: "string" }, description: { type: "string", nullable: true } } },
        } },
};
//# sourceMappingURL=roles.swagger.js.map