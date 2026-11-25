import {
  badRequestResponse,
  conflictResponse,
  idParam,
  invalidIdResponse,
  jsonBody,
  notFoundResponse,
  wrapped,
} from "../../../shared/http/swagger-common";

/**
 * Documentación OpenAPI del feature Customers.
 * Se registra en `src/swagger/index.ts`. Fase I — SIN AUTH.
 */
const TAG = "Clientes";

export const customersSwagger = {
  tags: [{ name: TAG, description: "Empresas cliente de la lavandería — CRUD" }],
  paths: {
    "/api/clientes": {
      get: {
        tags: [TAG],
        summary: "Listar clientes activos",
        responses: { "200": { description: "Lista de clientes", content: wrapped("customers", "Customer", true) } },
      },
      post: {
        tags: [TAG],
        summary: "Crear cliente",
        requestBody: jsonBody("CustomerCreate"),
        responses: {
          "201": { description: "Cliente creado", content: wrapped("customer", "Customer") },
          "400": badRequestResponse,
          "409": conflictResponse,
        },
      },
    },
    "/api/clientes/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener cliente por id",
        parameters: [idParam],
        responses: {
          "200": { description: "Cliente", content: wrapped("customer", "Customer") },
          "400": invalidIdResponse,
          "404": notFoundResponse,
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar cliente (PUT, sin status)",
        parameters: [idParam],
        requestBody: jsonBody("CustomerUpdate"),
        responses: {
          "200": { description: "Actualizado", content: wrapped("customer", "Customer") },
          "400": badRequestResponse,
          "404": notFoundResponse,
          "409": conflictResponse,
        },
      },
      patch: {
        tags: [TAG],
        summary: "Modificar cliente (PATCH parcial; status se ignora)",
        parameters: [idParam],
        requestBody: jsonBody("CustomerPatch"),
        responses: {
          "200": { description: "Actualizado", content: wrapped("customer", "Customer") },
          "400": badRequestResponse,
          "404": notFoundResponse,
          "409": conflictResponse,
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar cliente (físico)",
        description: "Borra la fila, también si ya tenía borrado lógico. 409 si tiene órdenes asociadas.",
        parameters: [idParam],
        responses: { "200": { description: "Eliminado" }, "400": invalidIdResponse, "404": notFoundResponse, "409": conflictResponse },
      },
    },
    "/api/clientes/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Desactivar cliente (borrado lógico)",
        parameters: [idParam],
        responses: { "200": { description: "Desactivado" }, "400": invalidIdResponse, "404": notFoundResponse },
      },
    },
  },
  components: {
    schemas: {
      Customer: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          business_name: { type: "string", example: "Hotel Waya Guajira S.A.S." },
          tax_id: { type: "string", example: "900123456-7" },
          contact_name: { type: "string", nullable: true, example: "Laura Epieyú" },
          phone: { type: "string", example: "3001234567" },
          email: { type: "string", format: "email", example: "compras@hotelwaya.com" },
          address: { type: "string", nullable: true, example: "Calle 1 #4-50, Riohacha" },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CustomerCreate: {
        type: "object",
        required: ["business_name", "tax_id", "phone", "email"],
        properties: {
          business_name: { type: "string", example: "Hotel Waya Guajira S.A.S." },
          tax_id: { type: "string", example: "900123456-7" },
          contact_name: { type: "string", example: "Laura Epieyú" },
          phone: { type: "string", example: "3001234567" },
          email: { type: "string", format: "email", example: "compras@hotelwaya.com" },
          address: { type: "string", example: "Calle 1 #4-50, Riohacha" },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      CustomerUpdate: {
        type: "object",
        required: ["business_name", "tax_id", "phone", "email"],
        properties: {
          business_name: { type: "string" },
          tax_id: { type: "string" },
          contact_name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string", format: "email" },
          address: { type: "string" },
        },
      },
      CustomerPatch: {
        type: "object",
        properties: {
          business_name: { type: "string" },
          tax_id: { type: "string" },
          contact_name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string", format: "email" },
          address: { type: "string" },
        },
      },
    },
  },
};
