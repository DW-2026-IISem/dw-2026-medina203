import {
  badRequestResponse,
  conflictResponse,
  idParam,
  invalidIdResponse,
  jsonBody,
  notFoundResponse,
  wrapped,
} from "../../../shared/http/swagger-common";

/** Documentación OpenAPI del feature GarmentTypes. */
const TAG = "Tipos de prenda";

export const garmentTypesSwagger = {
  tags: [{ name: TAG, description: "Catálogo de prendas que procesa la lavandería" }],
  paths: {
    "/api/tipos-prenda": {
      get: {
        tags: [TAG],
        summary: "Listar tipos de prenda activos",
        responses: { "200": { description: "Lista", content: wrapped("garment_types", "GarmentType", true) } },
      },
      post: {
        tags: [TAG],
        summary: "Crear tipo de prenda",
        requestBody: jsonBody("GarmentTypeCreate"),
        responses: {
          "201": { description: "Creado", content: wrapped("garment_type", "GarmentType") },
          "400": badRequestResponse,
          "409": conflictResponse,
        },
      },
    },
    "/api/tipos-prenda/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener tipo de prenda",
        parameters: [idParam],
        responses: {
          "200": { description: "Tipo de prenda", content: wrapped("garment_type", "GarmentType") },
          "400": invalidIdResponse,
          "404": notFoundResponse,
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar tipo de prenda (sin status)",
        parameters: [idParam],
        requestBody: jsonBody("GarmentTypeUpdate"),
        responses: {
          "200": { description: "Actualizado", content: wrapped("garment_type", "GarmentType") },
          "400": badRequestResponse,
          "404": notFoundResponse,
          "409": conflictResponse,
        },
      },
      patch: {
        tags: [TAG],
        summary: "Modificar tipo de prenda (parcial)",
        parameters: [idParam],
        requestBody: jsonBody("GarmentTypePatch"),
        responses: {
          "200": { description: "Actualizado", content: wrapped("garment_type", "GarmentType") },
          "400": badRequestResponse,
          "404": notFoundResponse,
          "409": conflictResponse,
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar tipo de prenda (físico)",
        description: "409 si hay servicios que lo referencian.",
        parameters: [idParam],
        responses: { "200": { description: "Eliminado" }, "400": invalidIdResponse, "404": notFoundResponse, "409": conflictResponse },
      },
    },
    "/api/tipos-prenda/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Desactivar tipo de prenda (borrado lógico)",
        parameters: [idParam],
        responses: { "200": { description: "Desactivado" }, "400": invalidIdResponse, "404": notFoundResponse },
      },
    },
  },
  components: {
    schemas: {
      GarmentType: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Sábanas" },
          description: { type: "string", nullable: true, example: "Sábanas de cama sencilla, doble y king" },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      GarmentTypeCreate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Sábanas" },
          description: { type: "string", example: "Sábanas de cama sencilla, doble y king" },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      GarmentTypeUpdate: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" }, description: { type: "string" } },
      },
      GarmentTypePatch: {
        type: "object",
        properties: { name: { type: "string" }, description: { type: "string" } },
      },
    },
  },
};
