import { idParam, invalidIdResponse, notFoundResponse, wrapped } from "../../../shared/http/swagger-common";

/**
 * Documentación OpenAPI de las sesiones propias.
 * `x-access: "jwt"` → solo requiere Bearer (401), no RBAC (sin 403).
 */
const TAG = "Sesiones";
const jwt = { "x-access": "jwt" };

export const refreshTokensSwagger = {
  tags: [{ name: TAG, description: "Sesiones (refresh tokens) del usuario autenticado — modalidad JWT" }],
  paths: {
    "/api/sesiones": {
      get: { tags: [TAG], ...jwt, summary: "Listar mis sesiones activas", responses: { "200": { description: "Sesiones", content: wrapped("sessions", "Session", true) } } },
      delete: { tags: [TAG], ...jwt, summary: "Purgar mis sesiones revocadas o expiradas", responses: { "200": { description: "Purgadas" } } },
    },
    "/api/sesiones/deactivate-all": {
      patch: { tags: [TAG], ...jwt, summary: "Revocar todas mis sesiones (cerrar sesión en todos los dispositivos)", responses: { "200": { description: "Revocadas" } } },
    },
    "/api/sesiones/{id}": {
      get: { tags: [TAG], ...jwt, summary: "Consultar una de mis sesiones", parameters: [idParam], responses: { "200": { description: "Sesión", content: wrapped("session", "Session") }, "400": invalidIdResponse, "404": notFoundResponse } },
    },
    "/api/sesiones/{id}/deactivate": {
      patch: { tags: [TAG], ...jwt, summary: "Revocar una de mis sesiones", parameters: [idParam], responses: { "200": { description: "Revocada" }, "400": invalidIdResponse, "404": notFoundResponse } },
    },
  },
  components: {
    schemas: {
      Session: {
        type: "object",
        properties: {
          id: { type: "integer" },
          user_id: { type: "integer" },
          family_id: { type: "string", format: "uuid" },
          device_info: { type: "string", nullable: true },
          expires_at: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["active", "inactive"] },
          is_expired: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
