import { badRequestResponse, conflictResponse, idParam, invalidIdResponse, notFoundResponse, wrapped } from "../../../shared/http/swagger-common";

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
        summary: "Conceder un recurso o guardar la matriz completa de un rol",
        description:
          "Dos formas (efecto inmediato: `authorize` consulta la matriz en cada petición):\n\n" +
          "- `{ role_id, resource_id }` → concede un recurso (**201**).\n" +
          "- `{ role_id, resource_ids }` → reconcilia en una transacción: activa los enviados y revoca los activos no enviados (**200**). " +
          "`resource_ids: []` deja al rol sin permisos. 400: ids inválidos, duplicados, inexistentes o inactivos, o ambas formas a la vez. " +
          "404: rol inexistente o inactivo. 409: ADMIN perdería el acceso al panel.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { oneOf: [{ $ref: "#/components/schemas/ResourceRoleCreate" }, { $ref: "#/components/schemas/ResourceRoleReconcile" }] },
              examples: {
                matriz: { summary: "Guardar matriz", value: { role_id: 2, resource_ids: [1, 2, 3] } },
                individual: { summary: "Conceder uno", value: { role_id: 2, resource_id: 6 } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Matriz guardada", content: { "application/json": { schema: { $ref: "#/components/schemas/ResourceRoleReconcileResponse" } } } },
          "201": { description: "Concedido", content: wrapped("grant", "ResourceRole") },
          "400": badRequestResponse,
          "404": notFoundResponse,
          "409": conflictResponse,
        },
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
      ResourceRoleReconcile: {
        type: "object",
        required: ["role_id", "resource_ids"],
        properties: {
          role_id: { type: "integer", example: 2 },
          resource_ids: { type: "array", items: { type: "integer", minimum: 1 }, uniqueItems: true, example: [1, 2, 3] },
        },
      },
      ResourceRoleReconcileResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Role permissions updated" },
          result: {
            type: "object",
            properties: {
              role_id: { type: "integer", example: 2 },
              activated: { type: "integer", example: 1 },
              deactivated: { type: "integer", example: 3 },
              total_active: { type: "integer", example: 3 },
            },
          },
        },
      },
    },
  },
};
