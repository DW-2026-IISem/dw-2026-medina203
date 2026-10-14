import { bearerSecurity, invalidIdResponse, unauthorizedResponse } from "../../../shared/http/swagger-security";

const id = [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }];

export const refreshTokensSwagger = {
  tags: [{ name: "Sesiones", description: "Sesiones propias mediante refresh tokens (JWT)" }],
  paths: {
    "/api/sesiones": {
      get: { tags: ["Sesiones"], summary: "Listar sesiones activas propias", security: bearerSecurity, responses: { "200": { description: "Sesiones sin token_hash" }, "401": unauthorizedResponse } },
      delete: { tags: ["Sesiones"], summary: "Purgar sesiones revocadas o expiradas propias", security: bearerSecurity, responses: { "200": { description: "Sesiones purgadas" }, "401": unauthorizedResponse } },
    },
    "/api/sesiones/deactivate-all": {
      patch: { tags: ["Sesiones"], summary: "Revocar todas las sesiones propias", security: bearerSecurity, responses: { "200": { description: "Sesiones revocadas" }, "401": unauthorizedResponse } },
    },
    "/api/sesiones/{id}": {
      get: { tags: ["Sesiones"], summary: "Consultar sesión propia", security: bearerSecurity, parameters: id, responses: { "200": { description: "Sesión sin token_hash" }, "400": invalidIdResponse, "401": unauthorizedResponse, "404": { description: "No existe o pertenece a otro usuario" } } },
    },
    "/api/sesiones/{id}/deactivate": {
      patch: { tags: ["Sesiones"], summary: "Revocar sesión propia", security: bearerSecurity, parameters: id, responses: { "200": { description: "Sesión revocada" }, "400": invalidIdResponse, "401": unauthorizedResponse, "404": { description: "No existe o pertenece a otro usuario" } } },
    },
  },
  components: { schemas: {
    Session: { type: "object", properties: {
      id: { type: "integer" }, user_id: { type: "integer" }, family_id: { type: "string", format: "uuid" },
      device_info: { type: "string", nullable: true }, expires_at: { type: "string", format: "date-time" },
      status: { type: "string", enum: ["active", "inactive"] }, is_expired: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" },
    } },
  } },
};