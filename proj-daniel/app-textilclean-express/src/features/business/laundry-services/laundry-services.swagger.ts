import {
  badRequestResponse,
  conflictResponse,
  idParam,
  invalidIdResponse,
  jsonBody,
  notFoundResponse,
  wrapped,
} from "../../../shared/http/swagger-common";

/** Documentación OpenAPI del feature LaundryServices. */
const TAG = "Servicios";

const editable = {
  name: { type: "string", example: "Lavado y secado - Sábanas" },
  description: { type: "string", example: "Lavado y secado de sábanas" },
  price: { type: "number", format: "double", minimum: 0, example: 5500 },
  billing_unit: { type: "string", enum: ["kg", "unit"], example: "kg", description: "kg = precio × peso; unit = precio × cantidad" },
  estimated_hours: { type: "integer", minimum: 1, example: 24 },
  garment_type_id: { type: "integer", minimum: 1, example: 1 },
};

export const laundryServicesSwagger = {
  tags: [{ name: TAG, description: "Servicios de lavandería por tipo de prenda" }],
  paths: {
    "/api/servicios": {
      get: {
        tags: [TAG],
        summary: "Listar servicios activos (incluye el tipo de prenda)",
        responses: { "200": { description: "Lista", content: wrapped("laundry_services", "LaundryService", true) } },
      },
      post: {
        tags: [TAG],
        summary: "Crear servicio",
        description: "El tipo de prenda debe existir (404) y estar activo (400).",
        requestBody: jsonBody("LaundryServiceCreate"),
        responses: {
          "201": { description: "Creado", content: wrapped("laundry_service", "LaundryService") },
          "400": badRequestResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/servicios/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener servicio",
        parameters: [idParam],
        responses: {
          "200": { description: "Servicio", content: wrapped("laundry_service", "LaundryService") },
          "400": invalidIdResponse,
          "404": notFoundResponse,
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar servicio (sin status)",
        parameters: [idParam],
        requestBody: jsonBody("LaundryServiceUpdate"),
        responses: {
          "200": { description: "Actualizado", content: wrapped("laundry_service", "LaundryService") },
          "400": badRequestResponse,
          "404": notFoundResponse,
        },
      },
      patch: {
        tags: [TAG],
        summary: "Modificar servicio (parcial)",
        parameters: [idParam],
        requestBody: jsonBody("LaundryServicePatch"),
        responses: {
          "200": { description: "Actualizado", content: wrapped("laundry_service", "LaundryService") },
          "400": badRequestResponse,
          "404": notFoundResponse,
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar servicio (físico)",
        description: "409 si hay líneas de órdenes que lo referencian.",
        parameters: [idParam],
        responses: { "200": { description: "Eliminado" }, "400": invalidIdResponse, "404": notFoundResponse, "409": conflictResponse },
      },
    },
    "/api/servicios/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Desactivar servicio (borrado lógico)",
        parameters: [idParam],
        responses: { "200": { description: "Desactivado" }, "400": invalidIdResponse, "404": notFoundResponse },
      },
    },
  },
  components: {
    schemas: {
      LaundryService: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          ...editable,
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          garment_type: {
            type: "object",
            properties: { id: { type: "integer", example: 1 }, name: { type: "string", example: "Sábanas" } },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      LaundryServiceCreate: {
        type: "object",
        required: ["name", "price", "billing_unit", "garment_type_id"],
        properties: { ...editable, status: { type: "string", enum: ["active", "inactive"], default: "active" } },
      },
      LaundryServiceUpdate: {
        type: "object",
        required: ["name", "price", "billing_unit", "estimated_hours", "garment_type_id"],
        properties: editable,
      },
      LaundryServicePatch: { type: "object", properties: editable },
    },
  },
};
