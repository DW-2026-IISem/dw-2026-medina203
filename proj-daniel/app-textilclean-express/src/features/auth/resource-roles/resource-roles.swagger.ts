import { badRequestResponse, conflictResponse, idParam, invalidIdResponse, jsonBody, notFoundResponse, wrapped } from "../../../shared/http/swagger-common";

/** Documentación OpenAPI del feature ResourceRoles. */
const TAG = "Concesiones de rol";

export const resourceRolesSwagger = {
  tags: [{ name: TAG, description: "Matriz de permisos: qué recursos puede ejecutar cada rol" }],
  paths: {
    "/api/concesiones-rol": {
      get: {
        tags: [TAG],
        summary: "Listar concesiones activas",
        parameters: [
          { name: "role_id", in: "query", required: false, schema: { type: "integer", minimum: 1 } },
          { name: "resource_id", in: "query", required: false, schema: { type: "integer", minimum: 1 } },
        ],
        responses: { "200": { description: "Lista", content: wrapped("grants", "ResourceRole", true) } },
      },
      post: {
        tags: [TAG],
        summary: "Conceder recurso a rol",
        description: "Efecto inmediato: `authorize` consulta la matriz en cada petición.",
        requestBody: jsonBody("ResourceRoleCreate"),
        responses: { "201": { description: "Concedido", content: wrapped("grant", "ResourceRole") }, "400": badRequestResponse, "404": notFoundResponse, "409": conflictResponse },
      },
    },
    "/api/concesiones-rol/{id}": {
      get: { tags: [TAG], summary: "Obtener concesión", parameters: [idParam], responses: { "200": { description: "Concesión", content: wrapped("grant", "ResourceRole") }, "400": invalidIdResponse, "404": notFoundResponse } },
    },
    "/api/concesiones-rol/{id}/deactivate": {
      patch: { tags: [TAG], summary: "Retirar concesión", parameters: [idParam], responses: { "200": { description: "Retirada" }, "400": invalidIdResponse, "404": notFoundResponse } },
    },
    "/api/concesiones-rol/{id}/reactivate": {
      patch: { tags: [TAG], summary: "Reactivar concesión", parameters: [idParam], responses: { "200": { description: "Reactivada" }, "400": invalidIdResponse, "404": notFoundResponse, "409": conflictResponse } },
    },
  },
  components: {
    schemas: {
      ResourceRole: {
        type: "object",
        properties: {
          id: { type: "integer" },
          role_id: { type: "integer" },
          resource_id: { type: "integer" },
          status: { type: "string", enum: ["active", "inactive"] },
          role: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } },
          resource: {
            type: "object",
            properties: { id: { type: "integer" }, method: { type: "string" }, path: { type: "string" }, description: { type: "string", nullable: true } },
          },
        },
      },
      ResourceRoleCreate: {
        type: "object",
        required: ["role_id", "resource_id"],
        properties: { role_id: { type: "integer", example: 2 }, resource_id: { type: "integer", example: 6 } },
      },
    },
  },
};
