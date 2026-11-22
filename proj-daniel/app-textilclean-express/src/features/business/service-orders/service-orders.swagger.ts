import {
  badRequestResponse,
  conflictResponse,
  idParam,
  invalidIdResponse,
  jsonBody,
  notFoundResponse,
  wrapped,
} from "../../../shared/http/swagger-common";

/** Documentación OpenAPI del feature ServiceOrders. */
const TAG = "Órdenes de servicio";
const processStatus = { type: "string", enum: ["received", "in_process", "ready", "delivered"] };

export const serviceOrdersSwagger = {
  tags: [{ name: TAG, description: "Órdenes de lavado de las empresas cliente (transaccionales)" }],
  paths: {
    "/api/ordenes": {
      get: {
        tags: [TAG],
        summary: "Listar órdenes activas",
        parameters: [
          { name: "customer_id", in: "query", required: false, schema: { type: "integer", minimum: 1 } },
          { name: "process_status", in: "query", required: false, schema: processStatus },
        ],
        responses: {
          "200": { description: "Lista (incluye el cliente)", content: wrapped("service_orders", "ServiceOrder", true) },
          "400": badRequestResponse,
        },
      },
      post: {
        tags: [TAG],
        summary: "Registrar orden con sus líneas (transacción)",
        description:
          "Verifica cliente activo y servicios activos, congela el precio de cada servicio, " +
          "calcula `line_total` (kg × precio o unidades × precio), subtotal y total. " +
          "Si no se envía `delivery_date`, se calcula con el mayor `estimated_hours`.",
        requestBody: jsonBody("ServiceOrderCreate"),
        responses: {
          "201": { description: "Orden creada con su detalle", content: wrapped("service_order", "ServiceOrder") },
          "400": badRequestResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/ordenes/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener orden con cliente y líneas activas",
        parameters: [idParam],
        responses: {
          "200": { description: "Orden", content: wrapped("service_order", "ServiceOrder") },
          "400": invalidIdResponse,
          "404": notFoundResponse,
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar datos de la orden (fechas, notas, impuesto, descuento)",
        parameters: [idParam],
        requestBody: jsonBody("ServiceOrderUpdate"),
        responses: {
          "200": { description: "Actualizada", content: wrapped("service_order", "ServiceOrder") },
          "400": badRequestResponse,
          "404": notFoundResponse,
          "409": { description: "La orden ya fue entregada" },
        },
      },
      patch: {
        tags: [TAG],
        summary: "Modificar datos de la orden (parcial)",
        parameters: [idParam],
        requestBody: jsonBody("ServiceOrderPatch"),
        responses: {
          "200": { description: "Actualizada", content: wrapped("service_order", "ServiceOrder") },
          "400": badRequestResponse,
          "404": notFoundResponse,
          "409": { description: "La orden ya fue entregada" },
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar orden y sus líneas (físico)",
        parameters: [idParam],
        responses: { "200": { description: "Eliminada" }, "400": invalidIdResponse, "404": notFoundResponse },
      },
    },
    "/api/ordenes/{id}/estado": {
      patch: {
        tags: [TAG],
        summary: "Avanzar el estado del proceso",
        description:
          "Solo un paso hacia adelante: received → in_process → ready → delivered. " +
          "Requiere al menos una línea activa. Al entregar, `delivery_date` toma la fecha real.",
        parameters: [idParam],
        requestBody: jsonBody("ServiceOrderProcessStatus"),
        responses: {
          "200": { description: "Estado actualizado", content: wrapped("service_order", "ServiceOrder") },
          "400": badRequestResponse,
          "404": notFoundResponse,
          "409": { description: "Transición no permitida" },
        },
      },
    },
    "/api/ordenes/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Anular orden (borrado lógico de la orden y sus líneas)",
        parameters: [idParam],
        responses: {
          "200": { description: "Anulada" },
          "400": invalidIdResponse,
          "404": notFoundResponse,
          "409": conflictResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      ServiceOrder: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          customer_id: { type: "integer", example: 1 },
          received_at: { type: "string", format: "date-time" },
          delivery_date: { type: "string", format: "date-time", nullable: true },
          process_status: { ...processStatus, example: "received" },
          notes: { type: "string", nullable: true, example: "Entregar en recepción" },
          subtotal: { type: "number", example: 177000 },
          tax: { type: "number", example: 1000 },
          discount: { type: "number", example: 500 },
          total: { type: "number", example: 177500 },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          customer: {
            type: "object",
            properties: {
              id: { type: "integer" },
              business_name: { type: "string" },
              tax_id: { type: "string" },
            },
          },
          items: { type: "array", items: { $ref: "#/components/schemas/ServiceOrderItem" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ServiceOrderCreate: {
        type: "object",
        required: ["customer_id", "items"],
        properties: {
          customer_id: { type: "integer", example: 1 },
          received_at: { type: "string", format: "date-time" },
          delivery_date: { type: "string", format: "date-time", nullable: true },
          notes: { type: "string", example: "Entregar en recepción" },
          tax: { type: "number", minimum: 0, default: 0 },
          discount: { type: "number", minimum: 0, default: 0 },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["laundry_service_id", "quantity"],
              properties: {
                laundry_service_id: { type: "integer", example: 2 },
                quantity: { type: "integer", minimum: 1, example: 10 },
                weight_kg: { type: "number", example: 12.5, description: "Obligatorio si el servicio se cobra por kg" },
              },
            },
          },
        },
      },
      ServiceOrderUpdate: {
        type: "object",
        required: ["received_at", "tax", "discount"],
        properties: {
          received_at: { type: "string", format: "date-time" },
          delivery_date: { type: "string", format: "date-time", nullable: true },
          notes: { type: "string", nullable: true },
          tax: { type: "number", minimum: 0 },
          discount: { type: "number", minimum: 0 },
        },
      },
      ServiceOrderPatch: {
        type: "object",
        properties: {
          received_at: { type: "string", format: "date-time" },
          delivery_date: { type: "string", format: "date-time", nullable: true },
          notes: { type: "string", nullable: true },
          tax: { type: "number", minimum: 0 },
          discount: { type: "number", minimum: 0 },
        },
      },
      ServiceOrderProcessStatus: {
        type: "object",
        required: ["process_status"],
        properties: { process_status: { ...processStatus, example: "in_process" } },
      },
    },
  },
};
