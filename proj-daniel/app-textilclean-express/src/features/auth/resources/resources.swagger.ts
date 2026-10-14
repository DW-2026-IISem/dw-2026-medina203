import { bearerSecurity, forbiddenResponse, invalidIdResponse, notFoundResponse, unauthorizedResponse } from "../../../shared/http/swagger-security";

const id = [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }];
const auth = { "401": unauthorizedResponse, "403": forbiddenResponse };

export const resourcesSwagger = {
  tags: [{ name: "Recursos", description: "Operaciones autorizables del API (JWT + RBAC)" }],
  paths: {
    "/api/recursos": {
      get: { tags: ["Recursos"], summary: "Listar recursos activos", security: bearerSecurity, responses: { "200": { description: "Recursos" }, ...auth } },
      post: { tags: ["Recursos"], summary: "Crear recurso", security: bearerSecurity, requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ResourceCreate" } } } }, responses: { "201": { description: "Creado" }, "409": { description: "Operación ya registrada" }, ...auth } },
    },
    "/api/recursos/{id}": {
      get: { tags: ["Recursos"], summary: "Consultar recurso", security: bearerSecurity, parameters: id, responses: { "200": { description: "Recurso" }, "400": invalidIdResponse, "404": notFoundResponse, ...auth } },
      put: { tags: ["Recursos"], summary: "Reemplazar recurso", security: bearerSecurity, parameters: id, requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ResourceUpdate" } } } }, responses: { "200": { description: "Actualizado" }, "404": notFoundResponse, "409": { description: "Operación duplicada" }, ...auth } },
      patch: { tags: ["Recursos"], summary: "Actualizar recurso", security: bearerSecurity, parameters: id, requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ResourcePatch" } } } }, responses: { "200": { description: "Actualizado" }, "404": notFoundResponse, "409": { description: "Operación duplicada" }, ...auth } },
      delete: { tags: ["Recursos"], summary: "Eliminar recurso físicamente", security: bearerSecurity, parameters: id, responses: { "200": { description: "Eliminado" }, "404": notFoundResponse, ...auth } },
    },
    "/api/recursos/{id}/deactivate": {
      patch: { tags: ["Recursos"], summary: "Desactivar recurso", security: bearerSecurity, parameters: id, responses: { "200": { description: "Desactivado" }, "404": notFoundResponse, ...auth } },
    },
  },
  components: { schemas: {
    Resource: { type: "object", properties: { id: { type: "integer" }, method: { type: "string" }, path: { type: "string" }, description: { type: "string", nullable: true }, status: { type: "string", enum: ["active", "inactive"] } } },
    ResourceCreate: { type: "object", required: ["method", "path"], properties: { method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] }, path: { type: "string" }, description: { type: "string", nullable: true } } },
    ResourceUpdate: { type: "object", required: ["method", "path"], properties: { method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] }, path: { type: "string" }, description: { type: "string", nullable: true } } },
    ResourcePatch: { type: "object", properties: { method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] }, path: { type: "string" }, description: { type: "string", nullable: true } } },
  } },
};