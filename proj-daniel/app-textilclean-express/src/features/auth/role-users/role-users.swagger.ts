import { bearerSecurity, forbiddenResponse, invalidIdResponse, notFoundResponse, unauthorizedResponse } from "../../../shared/http/swagger-security";

const id = [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }];
const auth = { "401": unauthorizedResponse, "403": forbiddenResponse };

export const roleUsersSwagger = {
  tags: [{ name: "Asignaciones usuario-rol", description: "Asignaciones de roles (JWT + RBAC)" }],
  paths: {
    "/api/asignaciones-rol": {
      get: { tags: ["Asignaciones usuario-rol"], summary: "Listar asignaciones activas", security: bearerSecurity, responses: { "200": { description: "Asignaciones" }, ...auth } },
      post: { tags: ["Asignaciones usuario-rol"], summary: "Asignar rol a usuario", security: bearerSecurity, requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RoleUserCreate" } } } }, responses: { "201": { description: "Asignado o reactivado" }, "404": notFoundResponse, "409": { description: "Ya estaba asignado" }, ...auth } },
    },
    "/api/asignaciones-rol/{id}": {
      get: { tags: ["Asignaciones usuario-rol"], summary: "Consultar asignación", security: bearerSecurity, parameters: id, responses: { "200": { description: "Asignación" }, "400": invalidIdResponse, "404": notFoundResponse, ...auth } },
    },
    "/api/asignaciones-rol/{id}/deactivate": {
      patch: { tags: ["Asignaciones usuario-rol"], summary: "Retirar rol", security: bearerSecurity, parameters: id, responses: { "200": { description: "Desactivada" }, "404": notFoundResponse, ...auth } },
    },
    "/api/asignaciones-rol/{id}/reactivate": {
      patch: { tags: ["Asignaciones usuario-rol"], summary: "Reactivar asignación", security: bearerSecurity, parameters: id, responses: { "200": { description: "Reactivada" }, "404": notFoundResponse, "409": { description: "Ya estaba activa" }, ...auth } },
    },
  },
  components: { schemas: {
    RoleUser: { type: "object", properties: { id: { type: "integer" }, user_id: { type: "integer" }, role_id: { type: "integer" }, status: { type: "string", enum: ["active", "inactive"] }, user: { type: "object" }, role: { type: "object" } } },
    RoleUserCreate: { type: "object", required: ["user_id", "role_id"], properties: { user_id: { type: "integer" }, role_id: { type: "integer" } } },
  } },
};