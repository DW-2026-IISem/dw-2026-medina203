import {
  bearerSecurity,
  bearerSecurityScheme,
  forbiddenResponse,
  invalidIdResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

const idParameter = [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }];
const authResponses = { "401": unauthorizedResponse, "403": forbiddenResponse };

export const usersSwagger = {
  tags: [{ name: "Usuarios", description: "Identidades y contraseñas (JWT + RBAC)" }],
  paths: {
    "/api/usuarios": {
      get: {
        tags: ["Usuarios"], summary: "Listar usuarios activos", security: bearerSecurity,
        responses: { "200": { description: "Usuarios listados" }, ...authResponses },
      },
      post: {
        tags: ["Usuarios"], summary: "Crear usuario", security: bearerSecurity,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UserCreate" } } } },
        responses: { "201": { description: "Usuario creado" }, "409": { description: "Username o email ya registrado" }, ...authResponses },
      },
    },
    "/api/usuarios/{id}": {
      get: {
        tags: ["Usuarios"], summary: "Obtener usuario", security: bearerSecurity, parameters: idParameter,
        responses: { "200": { description: "Usuario encontrado" }, "400": invalidIdResponse, "404": notFoundResponse, ...authResponses },
      },
      put: {
        tags: ["Usuarios"], summary: "Reemplazar datos del usuario", security: bearerSecurity, parameters: idParameter,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UserUpdate" } } } },
        responses: { "200": { description: "Usuario actualizado" }, "400": invalidIdResponse, "404": notFoundResponse, "409": { description: "Username o email ya registrado" }, ...authResponses },
      },
      patch: {
        tags: ["Usuarios"], summary: "Actualizar parcialmente el usuario", security: bearerSecurity, parameters: idParameter,
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/UserPatch" } } } },
        responses: { "200": { description: "Usuario actualizado" }, "400": invalidIdResponse, "404": notFoundResponse, ...authResponses },
      },
      delete: {
        tags: ["Usuarios"], summary: "Eliminar usuario físicamente", security: bearerSecurity, parameters: idParameter,
        responses: { "200": { description: "Usuario eliminado" }, "400": invalidIdResponse, "404": notFoundResponse, ...authResponses },
      },
    },
    "/api/usuarios/{id}/deactivate": {
      patch: {
        tags: ["Usuarios"], summary: "Desactivar usuario", security: bearerSecurity, parameters: idParameter,
        responses: { "200": { description: "Usuario desactivado" }, "400": invalidIdResponse, "404": notFoundResponse, ...authResponses },
      },
    },
    "/api/usuarios/{id}/password": {
      patch: {
        tags: ["Usuarios"], summary: "Cambiar contraseña", security: bearerSecurity, parameters: idParameter,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ChangePassword" } } } },
        responses: { "200": { description: "Contraseña actualizada" }, "400": { description: "Contraseña actual incorrecta o nueva inválida" }, "404": notFoundResponse, ...authResponses },
      },
    },
    "/api/usuarios/{id}/permisos": {
      get: {
        tags: ["Usuarios"],
        summary: "Consultar permisos efectivos del usuario",
        security: bearerSecurity,
        parameters: [idParameter[0]],
        responses: {
          "200": { description: "Permisos derivados del grafo RBAC activo" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
  },
  components: {
    securitySchemes: bearerSecurityScheme,
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer" }, username: { type: "string" }, email: { type: "string", format: "email" },
          avatar: { type: "string", nullable: true }, status: { type: "string", enum: ["active", "inactive"] },
          createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" },
        },
      },
      UserCreate: {
        type: "object", required: ["username", "email", "password"],
        properties: {
          username: { type: "string", minLength: 3, maxLength: 80 }, email: { type: "string", format: "email" },
          password: { type: "string", format: "password", minLength: 8 }, avatar: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      UserUpdate: {
        type: "object", required: ["username", "email"],
        properties: { username: { type: "string" }, email: { type: "string", format: "email" }, avatar: { type: "string", nullable: true } },
      },
      UserPatch: {
        type: "object",
        properties: { username: { type: "string" }, email: { type: "string", format: "email" }, avatar: { type: "string", nullable: true } },
      },
      ChangePassword: {
        type: "object", required: ["current_password", "new_password"],
        properties: { current_password: { type: "string", format: "password" }, new_password: { type: "string", format: "password", minLength: 8 } },
      },
    },
  },
};