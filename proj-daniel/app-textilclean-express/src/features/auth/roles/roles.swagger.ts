import { bearerSecurity, forbiddenResponse, invalidIdResponse, notFoundResponse, unauthorizedResponse } from "../../../shared/http/swagger-security";

const id = [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }];
const auth = { "401": unauthorizedResponse, "403": forbiddenResponse };

export const rolesSwagger = {
  tags: [{ name: "Roles", description: "Roles de autorización (JWT + RBAC)" }],
  paths: {
    "/api/roles": {
      get: { tags: ["Roles"], summary: "Listar roles activos", security: bearerSecurity, responses: { "200": { description: "Roles" }, ...auth } },
      post: { tags: ["Roles"], summary: "Crear rol", security: bearerSecurity, requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RoleCreate" } } } }, responses: { "201": { description: "Creado" }, "409": { description: "Nombre duplicado" }, ...auth } },
    },
    "/api/roles/{id}": {
      get: { tags: ["Roles"], summary: "Consultar rol", security: bearerSecurity, parameters: id, responses: { "200": { description: "Rol" }, "400": invalidIdResponse, "404": notFoundResponse, ...auth } },
      put: { tags: ["Roles"], summary: "Reemplazar rol", security: bearerSecurity, parameters: id, requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RoleUpdate" } } } }, responses: { "200": { description: "Actualizado" }, "400": invalidIdResponse, "404": notFoundResponse, "409": { description: "Nombre duplicado" }, ...auth } },
      patch: { tags: ["Roles"], summary: "Actualizar rol", security: bearerSecurity, parameters: id, requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/RolePatch" } } } }, responses: { "200": { description: "Actualizado" }, "400": invalidIdResponse, "404": notFoundResponse, ...auth } },
      delete: { tags: ["Roles"], summary: "Eliminar rol físicamente", security: bearerSecurity, parameters: id, responses: { "200": { description: "Eliminado" }, "404": notFoundResponse, ...auth } },
    },
    "/api/roles/{id}/deactivate": {
      patch: { tags: ["Roles"], summary: "Desactivar rol", security: bearerSecurity, parameters: id, responses: { "200": { description: "Desactivado" }, "404": notFoundResponse, ...auth } },
    },
  },
  components: { schemas: {
    Role: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, description: { type: "string", nullable: true }, status: { type: "string", enum: ["active", "inactive"] } } },
    RoleCreate: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string", nullable: true }, status: { type: "string", enum: ["active", "inactive"] } } },
    RoleUpdate: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string", nullable: true } } },
    RolePatch: { type: "object", properties: { name: { type: "string" }, description: { type: "string", nullable: true } } },
  } },
};