export const productSalesSwagger = {
  tags: [{ name: "DetalleVentas", description: "Líneas de venta con control de stock (sin auth)" }],
  paths: {
    "/api/detalle-ventas": {
      get: {
        tags: ["DetalleVentas"],
        summary: "Listar detalles de venta activos",
        responses: { "200": { description: "Lista de detalles" } },
      },
      post: {
        tags: ["DetalleVentas"],
        summary: "Agregar línea a una venta",
        description: "Valida la venta, el producto y el stock; reduce inventario y recalcula importes.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductSaleCreate" } } },
        },
        responses: {
          "201": { description: "Línea creada" },
          "400": { description: "Validación o stock insuficiente" },
          "404": { description: "Venta o producto no encontrado" },
        },
      },
    },
    "/api/detalle-ventas/{id}": {
      get: {
        tags: ["DetalleVentas"],
        summary: "Obtener detalle por id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        responses: { "200": { description: "Detalle encontrado" }, "404": { description: "No encontrado" } },
      },
      put: {
        tags: ["DetalleVentas"],
        summary: "Reemplazar cantidad de una línea",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductSaleUpdate" } } },
        },
        responses: { "200": { description: "Línea actualizada" }, "400": { description: "Stock insuficiente" }, "404": { description: "No encontrada" } },
      },
      patch: {
        tags: ["DetalleVentas"],
        summary: "Actualizar parcialmente una línea",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductSalePatch" } } },
        },
        responses: { "200": { description: "Línea actualizada" }, "400": { description: "Stock insuficiente" }, "404": { description: "No encontrada" } },
      },
      delete: {
        tags: ["DetalleVentas"],
        summary: "Eliminar línea físicamente y restaurar stock",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        responses: { "200": { description: "Línea eliminada" }, "404": { description: "No encontrada" } },
      },
    },
    "/api/detalle-ventas/{id}/deactivate": {
      patch: {
        tags: ["DetalleVentas"],
        summary: "Desactivar línea y restaurar stock",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        responses: { "200": { description: "Línea desactivada" }, "404": { description: "No encontrada" } },
      },
    },
  },
  components: {
    schemas: {
      ProductSale: {
        type: "object",
        properties: {
          id: { type: "integer" },
          sale_id: { type: "integer" },
          product_id: { type: "integer" },
          quantity: { type: "integer" },
          unit_price: { type: "number" },
          line_total: { type: "number" },
          status: { type: "string", enum: ["active", "inactive"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductSaleCreate: {
        type: "object",
        required: ["sale_id", "product_id", "quantity"],
        properties: {
          sale_id: { type: "integer" },
          product_id: { type: "integer" },
          quantity: { type: "integer", minimum: 1 },
        },
      },
      ProductSaleUpdate: {
        type: "object",
        required: ["quantity"],
        properties: { quantity: { type: "integer", minimum: 1 } },
      },
      ProductSalePatch: {
        type: "object",
        properties: { quantity: { type: "integer", minimum: 1 } },
      },
    },
  },
};