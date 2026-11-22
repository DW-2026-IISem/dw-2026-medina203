import {
  badRequestResponse,
  idParam,
  invalidIdResponse,
  jsonBody,
  notFoundResponse,
  wrapped,
} from "../../../shared/http/swagger-common";

/** Documentación OpenAPI del feature ServiceOrderItems. */
const TAG = "Detalle de órdenes";
const delivered = { description: "La orden ya fue entregada" };

export const serviceOrderItemsSwagger = {
  tags: [{ name: TAG, description: "Líneas de las órdenes de servicio; cada cambio recalcula los totales" }],
  paths: {
    "/api/detalle-ordenes": {
      get: {
        tags: [TAG],
        summary: "Listar líneas activas",
        parameters: [{ name: "service_order_id", in: "query", required: false, schema: { type: "integer", minimum: 1 } }],
        responses: {
          "200": { description: "Lista", content: wrapped("service_order_items", "ServiceOrderItem", true) },
          "400": badRequestResponse,
        },
      },
      post: {
        tags: [TAG],
        summary: "Agregar línea a una orden",
        requestBody: jsonBody("ServiceOrderItemCreate"),
        responses: {
          "201": { description: "Creada", content: wrapped("service_order_item", "ServiceOrderItem") },
          "400": badRequestResponse,
          "404": notFoundResponse,
          "409": delivered,
        },
      },
    },
    "/api/detalle-ordenes/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener línea",
        parameters: [idParam],
        responses: {
          "200": { description: "Línea", content: wrapped("service_order_item", "ServiceOrderItem") },
          "400": invalidIdResponse,
          "404": notFoundResponse,
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar cantidad y peso",
        parameters: [idParam],
        requestBody: jsonBody("ServiceOrderItemUpdate"),
        responses: {
          "200": { description: "Actualizada", content: wrapped("service_order_item", "ServiceOrderItem") },
          "400": badRequestResponse,
          "404": notFoundResponse,
          "409": delivered,
        },
      },
      patch: {
        tags: [TAG],
        summary: "Modificar cantidad o peso",
        parameters: [idParam],
        requestBody: jsonBody("ServiceOrderItemPatch"),
        responses: {
          "200": { description: "Actualizada", content: wrapped("service_order_item", "ServiceOrderItem") },
          "400": badRequestResponse,
          "404": notFoundResponse,
          "409": delivered,
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar línea (físico)",
        parameters: [idParam],
        responses: { "200": { description: "Eliminada" }, "400": invalidIdResponse, "404": notFoundResponse, "409": delivered },
      },
    },
    "/api/detalle-ordenes/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Desactivar línea (borrado lógico)",
        parameters: [idParam],
        responses: { "200": { description: "Desactivada" }, "400": invalidIdResponse, "404": notFoundResponse, "409": delivered },
      },
    },
  },
  components: {
    schemas: {
      ServiceOrderItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          service_order_id: { type: "integer", example: 1 },
          laundry_service_id: { type: "integer", example: 2 },
          quantity: { type: "integer", example: 10 },
          weight_kg: { type: "number", nullable: true, example: 12.5 },
          unit_price: { type: "number", example: 8000, description: "Precio congelado al crear la línea" },
          line_total: { type: "number", example: 100000 },
          status: { type: "string", enum: ["active", "inactive"] },
          laundry_service: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              billing_unit: { type: "string", enum: ["kg", "unit"] },
            },
          },
        },
      },
      ServiceOrderItemCreate: {
        type: "object",
        required: ["service_order_id", "laundry_service_id", "quantity"],
        properties: {
          service_order_id: { type: "integer", example: 1 },
          laundry_service_id: { type: "integer", example: 2 },
          quantity: { type: "integer", minimum: 1, example: 10 },
          weight_kg: { type: "number", example: 12.5 },
        },
      },
      ServiceOrderItemUpdate: {
        type: "object",
        required: ["quantity"],
        properties: { quantity: { type: "integer", minimum: 1 }, weight_kg: { type: "number", nullable: true } },
      },
      ServiceOrderItemPatch: {
        type: "object",
        properties: { quantity: { type: "integer", minimum: 1 }, weight_kg: { type: "number", nullable: true } },
      },
    },
  },
};
