export const salesSwagger = {
  tags: [{ name: "Ventas", description: "Ventas con stock transaccional (sin auth)" }],
  paths: {
    "/api/ventas": {
      get: {
        tags: ["Ventas"],
        summary: "Listar ventas activas",
        responses: { "200": { description: "Lista de ventas" } },
      },
      post: {
        tags: ["Ventas"],
        summary: "Crear venta con sus líneas en una transacción",
        description: "Valida cliente, productos y stock; calcula importes y descuenta inventario.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SaleCreate" } } },
        },
        responses: {
          "201": { description: "Venta creada" },
          "400": { description: "Solicitud inválida o stock insuficiente" },
          "404": { description: "Cliente o producto no encontrado" },
        },
      },
    },
    "/api/ventas/{id}": {
      get: {
        tags: ["Ventas"],
        summary: "Obtener venta por id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        responses: { "200": { description: "Venta encontrada" }, "400": { description: "id inválido" }, "404": { description: "No encontrada" } },
      },
      put: {
        tags: ["Ventas"],
        summary: "Actualizar fecha e importes de una venta",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SaleUpdate" } } },
        },
        responses: { "200": { description: "Venta actualizada" }, "400": { description: "Importes inválidos" }, "404": { description: "No encontrada" } },
      },
      patch: {
        tags: ["Ventas"],
        summary: "Actualizar parcialmente una venta",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SalePatch" } } },
        },
        responses: { "200": { description: "Venta actualizada" }, "400": { description: "Importes inválidos" }, "404": { description: "No encontrada" } },
      },
      delete: {
        tags: ["Ventas"],
        summary: "Eliminar venta físicamente y restaurar stock",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        responses: { "200": { description: "Venta eliminada" }, "404": { description: "No encontrada" } },
      },
    },
    "/api/ventas/{id}/deactivate": {
      patch: {
        tags: ["Ventas"],
        summary: "Desactivar venta y restaurar stock",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        responses: { "200": { description: "Venta desactivada" }, "404": { description: "No encontrada" } },
      },
    },
  },
  components: {
    schemas: {
      Sale: {
        type: "object",
        properties: {
          id: { type: "integer" },
          sale_date: { type: "string", format: "date-time" },
          subtotal: { type: "number" },
          tax: { type: "number" },
          discounts: { type: "number" },
          total: { type: "number" },
          client_id: { type: "integer" },
          status: { type: "string", enum: ["active", "inactive"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SaleCreate: {
        type: "object",
        required: ["client_id", "items"],
        properties: {
          client_id: { type: "integer" },
          sale_date: { type: "string", format: "date-time" },
          tax: { type: "number", minimum: 0, default: 0 },
          discounts: { type: "number", minimum: 0, default: 0 },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["product_id", "quantity"],
              properties: { product_id: { type: "integer" }, quantity: { type: "integer", minimum: 1 } },
            },
          },
        },
      },
      SaleUpdate: {
        type: "object",
        required: ["sale_date", "tax", "discounts"],
        properties: {
          sale_date: { type: "string", format: "date-time" },
          tax: { type: "number", minimum: 0 },
          discounts: { type: "number", minimum: 0 },
        },
      },
      SalePatch: {
        type: "object",
        properties: {
          sale_date: { type: "string", format: "date-time" },
          tax: { type: "number", minimum: 0 },
          discounts: { type: "number", minimum: 0 },
        },
      },
    },
  },
};