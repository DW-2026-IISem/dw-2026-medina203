import { badRequestResponse, jsonBody, wrapped } from "../../../shared/http/swagger-common";

/** Documentación OpenAPI de Session. login/refresh/logout son OPEN (`security: []`). */
const TAG = "Sesión";
const open = { security: [] as unknown[] };
const jwt = { "x-access": "jwt" };
const tokens = { "application/json": { schema: { $ref: "#/components/schemas/SessionTokens" } } };
const invalid = { description: "Credenciales o refresh token inválidos, expirados o reutilizados" };

export const sessionSwagger = {
  tags: [{ name: TAG, description: "Login, renovación, cierre de sesión y perfil" }],
  paths: {
    "/api/sesion/login": {
      post: {
        tags: [TAG], ...open,
        summary: "Iniciar sesión (OPEN)",
        description: "Credenciales de laboratorio: `admin / Admin123!` y `operador / Operador123!`.",
        requestBody: jsonBody("Login"),
        responses: { "200": { description: "Tokens emitidos", content: tokens }, "400": badRequestResponse, "401": invalid },
      },
    },
    "/api/sesion/refresh": {
      post: {
        tags: [TAG], ...open,
        summary: "Renovar tokens con rotación (OPEN)",
        description: "Devuelve un nuevo par de tokens e invalida el refresh token usado. Reusar uno viejo revoca toda la familia.",
        requestBody: jsonBody("RefreshSession"),
        responses: { "200": { description: "Tokens renovados", content: tokens }, "400": badRequestResponse, "401": invalid },
      },
    },
    "/api/sesion/logout": {
      post: {
        tags: [TAG], ...open,
        summary: "Cerrar sesión (OPEN): revoca el refresh token",
        requestBody: jsonBody("RefreshSession"),
        responses: { "200": { description: "Sesión cerrada" }, "400": badRequestResponse },
      },
    },
    "/api/sesion/perfil": {
      get: {
        tags: [TAG], ...jwt,
        summary: "Mi perfil y mis roles (JWT)",
        responses: { "200": { description: "Perfil", content: wrapped("user", "Profile") } },
      },
    },
    "/api/permisos": {
      get: {
        tags: [TAG], ...jwt,
        summary: "Mis permisos efectivos (JWT)",
        description: "La UI los usa para mostrar u ocultar opciones según el rol.",
        responses: { "200": { description: "Permisos", content: wrapped("permissions", "EffectivePermission", true) } },
      },
    },
  },
  components: {
    schemas: {
      Login: {
        type: "object",
        required: ["identifier", "password"],
        properties: {
          identifier: { type: "string", description: "username o email", example: "admin" },
          password: { type: "string", format: "password", example: "Admin123!" },
        },
      },
      RefreshSession: {
        type: "object",
        required: ["refresh_token"],
        properties: { refresh_token: { type: "string" } },
      },
      SessionTokens: {
        type: "object",
        properties: {
          access_token: { type: "string" },
          token_type: { type: "string", example: "Bearer" },
          expires_in: { type: "integer", example: 900 },
          refresh_token: { type: "string" },
          refresh_expires_in: { type: "integer", example: 604800 },
        },
      },
      Profile: {
        type: "object",
        properties: {
          id: { type: "integer" },
          username: { type: "string", example: "operador" },
          full_name: { type: "string", nullable: true, example: "Operario de planta" },
          email: { type: "string", format: "email" },
          avatar: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"] },
          roles: { type: "array", items: { type: "string" }, example: ["OPERATOR"] },
        },
      },
    },
  },
};
