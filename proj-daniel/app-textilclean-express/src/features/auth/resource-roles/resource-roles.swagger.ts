import { bearerSecurity, forbiddenResponse, invalidIdResponse, notFoundResponse, unauthorizedResponse } from "../../../shared/http/swagger-security";

const id = [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }];
const auth = { "401": unauthorizedResponse, "403": forbiddenResponse };

export const resourceRolesSwagger = {
  tags: [{ name: "Concesiones de rol", description: "Concesiones de recursos a roles (JWT + RBAC)" }],
  paths: {
    "/api/concesiones-rol": {
      get: {
        tags: ["Concesiones de rol"], summary: "Listar concesiones activas", security: bearerSecurity,
        parameters: [
          { name: "role_id", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "resource_id", in: "query", schema: { type: "integer", minimum: 1 } },
        ],
        responses: { "200": { description: "Concesiones" }, ...auth },
      },
      post: {
        tags: ["Concesiones de rol"], summary: "Conceder recurso a rol", security: bearerSecurity,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ResourceRoleCreate" } } } },
        responses: { "201": { description: "Concedido o reactivado" }, "404": notFoundResponse, "409": { description: "Concesión ya activa" }, ...auth },
      },
    },
    "/api/concesiones-rol/{id}": {
      get: { tags: ["Concesiones de rol"], summary: "Consultar concesión", security: bearerSecurity, parameters: id, responses: { "200": { description: "Concesión" }, "400": invalidIdResponse, "404": notFoundResponse, ...auth } },
    },
    "/api/concesiones-rol/{id}/deactivate": {
      patch: { tags: ["Concesiones de rol"], summary: "Retirar permiso", security: bearerSecurity, parameters: id, responses: { "200": { description: "Concesión desactivada" }, "404": notFoundResponse, ...auth } },
    },
    "/api/concesiones-rol/{id}/reactivate": {
      patch: { tags: ["Concesiones de rol"], summary: "Reactivar permiso", security: bearerSecurity, parameters: id, responses: { "200": { description: "Concesión reactivada" }, "404": notFoundResponse, "409": { description: "Ya activa" }, ...auth } },
    },
  },
  components: { schemas: {
    ResourceRole: { type: "object", properties: { id: { type: "integer" }, role_id: { type: "integer" }, resource_id: { type: "integer" }, status: { type: "string", enum: ["active", "inactive"] }, role: { type: "object" }, resource: { type: "object" } } },
    ResourceRoleCreate: { type: "object", required: ["role_id", "resource_id"], properties: { role_id: { type: "integer" }, resource_id: { type: "integer" } } },
  } },
};