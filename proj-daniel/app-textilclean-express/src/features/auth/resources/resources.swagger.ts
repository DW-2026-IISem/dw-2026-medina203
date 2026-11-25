import {
  badRequestResponse,
  conflictResponse,
  idParam,
  invalidIdResponse,
  jsonBody,
  notFoundResponse,
  wrapped,
} from "../../../shared/http/swagger-common";

/** Documentación OpenAPI del feature Resources. */
const TAG = "Recursos";
const method = { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] };

export const resourcesSwagger = {
  tags: [{ name: TAG, description: "Operaciones HTTP protegibles (METHOD + path)" }],
  paths: {
    "/api/recursos": {
      get: { tags: [TAG], summary: "Listar recursos activos", responses: { "200": { description: "Lista", content: wrapped("resources", "Resource", true) } } },
      post: {
        tags: [TAG],
        summary: "Registrar recurso",
        requestBody: jsonBody("ResourceCreate"),
        responses: { "201": { description: "Creado", content: wrapped("resource", "Resource") }, "400": badRequestResponse, "409": conflictResponse },
      },
    },
    "/api/recursos/{id}": {
      get: { tags: [TAG], summary: "Obtener recurso", parameters: [idParam], responses: { "200": { description: "Recurso", content: wrapped("resource", "Resource") }, "400": invalidIdResponse, "404": notFoundResponse } },
      put: { tags: [TAG], summary: "Reemplazar recurso", parameters: [idParam], requestBody: jsonBody("ResourceUpdate"), responses: { "200": { description: "Actualizado", content: wrapped("resource", "Resource") }, "400": badRequestResponse, "404": notFoundResponse, "409": conflictResponse } },
      patch: { tags: [TAG], summary: "Modificar recurso", parameters: [idParam], requestBody: jsonBody("ResourcePatch"), responses: { "200": { description: "Actualizado", content: wrapped("resource", "Resource") }, "400": badRequestResponse, "404": notFoundResponse, "409": conflictResponse } },
      delete: { tags: [TAG], summary: "Eliminar recurso (físico)", parameters: [idParam], responses: { "200": { description: "Eliminado" }, "400": invalidIdResponse, "404": notFoundResponse, "409": conflictResponse } },
    },
    "/api/recursos/{id}/deactivate": {
      patch: { tags: [TAG], summary: "Desactivar recurso", parameters: [idParam], responses: { "200": { description: "Desactivado" }, "400": invalidIdResponse, "404": notFoundResponse } },
    },
  },
  components: {
    schemas: {
      Resource: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          method: { ...method, example: "GET" },
          path: { type: "string", example: "/api/ordenes/:id" },
          description: { type: "string", nullable: true, example: "Consultar orden" },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
      ResourceCreate: {
        type: "object",
        required: ["method", "path"],
        properties: {
          method: { ...method, example: "GET" },
          path: { type: "string", example: "/api/reportes/ordenes" },
          description: { type: "string", example: "Reporte de órdenes" },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      ResourceUpdate: { type: "object", required: ["method", "path"], properties: { method, path: { type: "string" }, description: { type: "string", nullable: true } } },
      ResourcePatch: { type: "object", properties: { method, path: { type: "string" }, description: { type: "string", nullable: true } } },
    },
  },
};
