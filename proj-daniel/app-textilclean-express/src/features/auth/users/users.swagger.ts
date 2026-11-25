import {
  badRequestResponse,
  conflictResponse,
  idParam,
  invalidIdResponse,
  jsonBody,
  notFoundResponse,
  wrapped,
} from "../../../shared/http/swagger-common";

/** Documentación OpenAPI del feature Users. */
const TAG = "Usuarios";

export const usersSwagger = {
  tags: [{ name: TAG, description: "Personal de la lavandería: identidad y contraseña" }],
  paths: {
    "/api/usuarios": {
      get: {
        tags: [TAG],
        summary: "Listar usuarios activos",
        responses: { "200": { description: "Lista", content: wrapped("users", "User", true) } },
      },
      post: {
        tags: [TAG],
        summary: "Crear usuario",
        requestBody: jsonBody("UserCreate"),
        responses: {
          "201": { description: "Creado", content: wrapped("user", "User") },
          "400": badRequestResponse,
          "409": conflictResponse,
        },
      },
    },
    "/api/usuarios/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener usuario",
        parameters: [idParam],
        responses: { "200": { description: "Usuario", content: wrapped("user", "User") }, "400": invalidIdResponse, "404": notFoundResponse },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar datos del usuario",
        parameters: [idParam],
        requestBody: jsonBody("UserUpdate"),
        responses: { "200": { description: "Actualizado", content: wrapped("user", "User") }, "400": badRequestResponse, "404": notFoundResponse, "409": conflictResponse },
      },
      patch: {
        tags: [TAG],
        summary: "Modificar usuario (parcial)",
        parameters: [idParam],
        requestBody: jsonBody("UserPatch"),
        responses: { "200": { description: "Actualizado", content: wrapped("user", "User") }, "400": badRequestResponse, "404": notFoundResponse, "409": conflictResponse },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar usuario (físico)",
        parameters: [idParam],
        responses: { "200": { description: "Eliminado" }, "400": invalidIdResponse, "404": notFoundResponse, "409": conflictResponse },
      },
    },
    "/api/usuarios/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Desactivar usuario",
        parameters: [idParam],
        responses: { "200": { description: "Desactivado" }, "400": invalidIdResponse, "404": notFoundResponse },
      },
    },
    "/api/usuarios/{id}/password": {
      patch: {
        tags: [TAG],
        summary: "Cambiar contraseña (requiere la actual)",
        parameters: [idParam],
        requestBody: jsonBody("ChangePassword"),
        responses: { "200": { description: "Contraseña actualizada" }, "400": badRequestResponse, "404": notFoundResponse },
      },
    },
    "/api/usuarios/{id}/permisos": {
      get: {
        tags: [TAG],
        summary: "Permisos efectivos del usuario",
        description: "Recursos activos concedidos a los roles activos del usuario.",
        parameters: [idParam],
        responses: {
          "200": { description: "Permisos", content: wrapped("permissions", "EffectivePermission", true) },
          "400": invalidIdResponse,
          "404": notFoundResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      EffectivePermission: {
        type: "object",
        properties: {
          resource_id: { type: "integer" },
          method: { type: "string", example: "PATCH" },
          path: { type: "string", example: "/api/ordenes/:id/estado" },
          description: { type: "string", nullable: true },
          role_id: { type: "integer" },
          role_name: { type: "string", example: "OPERATOR" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          username: { type: "string", example: "operador" },
          full_name: { type: "string", nullable: true, example: "Operario de planta" },
          email: { type: "string", format: "email", example: "operador@textilclean.local" },
          avatar: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UserCreate: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string", minLength: 3, maxLength: 80, example: "lavador.turno1" },
          full_name: { type: "string", example: "Carlos Pushaina" },
          email: { type: "string", format: "email", example: "lavador1@textilclean.local" },
          password: { type: "string", format: "password", minLength: 8, example: "Password123!" },
          avatar: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      UserUpdate: {
        type: "object",
        required: ["username", "email"],
        properties: {
          username: { type: "string" },
          full_name: { type: "string", nullable: true },
          email: { type: "string", format: "email" },
          avatar: { type: "string", nullable: true },
        },
      },
      UserPatch: {
        type: "object",
        properties: {
          username: { type: "string" },
          full_name: { type: "string", nullable: true },
          email: { type: "string", format: "email" },
          avatar: { type: "string", nullable: true },
        },
      },
      ChangePassword: {
        type: "object",
        required: ["current_password", "new_password"],
        properties: {
          current_password: { type: "string", format: "password" },
          new_password: { type: "string", format: "password", minLength: 8 },
        },
      },
    },
  },
};
