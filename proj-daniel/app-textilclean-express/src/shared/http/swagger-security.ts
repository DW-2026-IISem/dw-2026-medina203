export const bearerSecurityScheme = {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Access token JWT enviado en Authorization: Bearer <access_token>.",
  },
};

export const openSecurity: unknown[] = [];
export const bearerSecurity = [{ bearerAuth: [] }];

export const unauthorizedResponse = {
  description: "401 No autenticado: falta un Bearer token válido o expiró.",
};

export const forbiddenResponse = {
  description: "403 Prohibido: no existe una concesión activa para esta operación.",
};

export const invalidIdResponse = {
  description: "400 id inválido (debe ser un entero positivo)",
};

export const notFoundResponse = { description: "404 No encontrado" };