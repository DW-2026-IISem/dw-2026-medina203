/**
 * Piezas OpenAPI reutilizadas por los `*.swagger.ts` de cada feature.
 */
export const idParam = {
  name: "id",
  in: "path",
  required: true,
  description: "id numérico (> 0). Si no lo es, la API responde 400.",
  schema: { type: "integer", minimum: 1 },
};

export const errorSchema = {
  type: "object",
  properties: { error: { type: "string", example: "Customer not found" } },
};

const errorContent = { "application/json": { schema: { $ref: "#/components/schemas/Error" } } };

export const invalidIdResponse = { description: "id inválido (debe ser un entero positivo)", content: errorContent };
export const badRequestResponse = { description: "Datos inválidos o regla de negocio incumplida", content: errorContent };
export const notFoundResponse = { description: "No encontrado (o con borrado lógico)", content: errorContent };
export const conflictResponse = { description: "Valor duplicado o registro referenciado", content: errorContent };

/** `{ <key>: <$ref> }` como cuerpo JSON de respuesta. */
export function wrapped(key: string, ref: string, isArray = false) {
  const item = { $ref: `#/components/schemas/${ref}` };
  return {
    "application/json": {
      schema: {
        type: "object",
        properties: { [key]: isArray ? { type: "array", items: item } : item },
      },
    },
  };
}

/** Cuerpo JSON de petición que apunta a un schema. */
export function jsonBody(ref: string) {
  return {
    required: true,
    content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } },
  };
}
