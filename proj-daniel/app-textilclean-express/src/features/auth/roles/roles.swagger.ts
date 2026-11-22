import {
  badRequestResponse,
  conflictResponse,
  idParam,
  invalidIdResponse,
  jsonBody,
  notFoundResponse,
  wrapped,
} from "../../../shared/http/swagger-common";

/** Documentación OpenAPI del feature Roles. */
const TAG = "Roles";

export const rolesSwagger = {
  tags: [{ name: TAG, description: "Roles RBAC (ADMIN, OPERATOR…)" }],
  paths: {
    "/api/roles": {
      get: { tags: [TAG], summary: "Listar roles activos", responses: { "200": { description: "Lista", content: wrapped("roles", "Role", true) } } },
      post: {
        tags: [TAG],
        summary: "Crear rol (nombre en mayúsculas)",
        requestBody: jsonBody("RoleCreate"),
        responses: { "201": { description: "Creado", content: wrapped("role", "Role") }, "400": badRequestResponse, "409": conflictResponse },
      },
    },
    "/api/roles/{id}": {
      get: { tags: [TAG], summary: "Obtener rol", parameters: [idParam], responses: { "200": { description: "Rol", content: wrapped("role", "Role") }, "400": invalidIdResponse, "404": notFoundResponse } },
      put: { tags: [TAG], summary: "Reemplazar rol", parameters: [idParam], requestBody: jsonBody("RoleUpdate"), responses: { "200": { description: "Actualizado", content: wrapped("role", "Role") }, "400": badRequestResponse, "404": notFoundResponse, "409": conflictResponse } },
      patch: { tags: [TAG], summary: "Modificar rol", parameters: [idParam], requestBody: jsonBody("RolePatch"), responses: { "200": { description: "Actualizado", content: wrapped("role", "Role") }, "400": badRequestResponse, "404": notFoundResponse, "409": conflictResponse } },
      delete: { tags: [TAG], summary: "Eliminar rol (físico)", parameters: [idParam], responses: { "200": { description: "Eliminado" }, "400": invalidIdResponse, "404": notFoundResponse, "409": conflictResponse } },
    },
    "/api/roles/{id}/deactivate": {
      patch: { tags: [TAG], summary: "Desactivar rol", parameters: [idParam], responses: { "200": { description: "Desactivado" }, "400": invalidIdResponse, "404": notFoundResponse } },
    },
  },
  components: {
    schemas: {
      Role: {
        type: "object",
        properties: {
          id: { type: "integer", example: 2 },
          name: { type: "string", example: "OPERATOR" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
      RoleCreate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "SUPERVISOR" },
          description: { type: "string", example: "Supervisa la planta de lavado" },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      RoleUpdate: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string", nullable: true } } },
      RolePatch: { type: "object", properties: { name: { type: "string" }, description: { type: "string", nullable: true } } },
    },
  },
};
