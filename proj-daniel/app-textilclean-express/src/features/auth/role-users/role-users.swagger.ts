import { badRequestResponse, conflictResponse, idParam, invalidIdResponse, jsonBody, notFoundResponse, wrapped } from "../../../shared/http/swagger-common";

/** Documentación OpenAPI del feature RoleUsers. */
const TAG = "Asignaciones de rol";

export const roleUsersSwagger = {
  tags: [{ name: TAG, description: "Qué rol tiene cada usuario (asignar, retirar, reactivar)" }],
  paths: {
    "/api/asignaciones-rol": {
      get: { tags: [TAG], summary: "Listar asignaciones activas", responses: { "200": { description: "Lista", content: wrapped("assignments", "RoleUser", true) } } },
      post: {
        tags: [TAG],
        summary: "Asignar rol a usuario",
        description: "Si la asignación existía inactiva, se reactiva.",
        requestBody: jsonBody("RoleUserCreate"),
        responses: { "201": { description: "Asignado", content: wrapped("assignment", "RoleUser") }, "400": badRequestResponse, "404": notFoundResponse, "409": conflictResponse },
      },
    },
    "/api/asignaciones-rol/{id}": {
      get: { tags: [TAG], summary: "Obtener asignación", parameters: [idParam], responses: { "200": { description: "Asignación", content: wrapped("assignment", "RoleUser") }, "400": invalidIdResponse, "404": notFoundResponse } },
    },
    "/api/asignaciones-rol/{id}/deactivate": {
      patch: { tags: [TAG], summary: "Retirar rol", parameters: [idParam], responses: { "200": { description: "Retirado" }, "400": invalidIdResponse, "404": notFoundResponse } },
    },
    "/api/asignaciones-rol/{id}/reactivate": {
      patch: { tags: [TAG], summary: "Reactivar rol", parameters: [idParam], responses: { "200": { description: "Reactivado" }, "400": invalidIdResponse, "404": notFoundResponse, "409": conflictResponse } },
    },
  },
  components: {
    schemas: {
      RoleUser: {
        type: "object",
        properties: {
          id: { type: "integer" },
          user_id: { type: "integer" },
          role_id: { type: "integer" },
          status: { type: "string", enum: ["active", "inactive"] },
          user: { type: "object", properties: { id: { type: "integer" }, username: { type: "string" }, email: { type: "string" } } },
          role: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } },
        },
      },
      RoleUserCreate: {
        type: "object",
        required: ["user_id", "role_id"],
        properties: { user_id: { type: "integer", example: 3 }, role_id: { type: "integer", example: 2 } },
      },
    },
  },
};
