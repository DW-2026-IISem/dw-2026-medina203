import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { errorSchema } from "../shared/http/swagger-common";
import {
  bearerSecurity,
  bearerSecurityScheme,
  forbiddenResponse,
  unauthorizedResponse,
} from "../shared/http/swagger-security";
import { customersSwagger } from "../features/business/customers/customers.swagger";
import { garmentTypesSwagger } from "../features/business/garment-types/garment-types.swagger";
import { laundryServicesSwagger } from "../features/business/laundry-services/laundry-services.swagger";
import { serviceOrdersSwagger } from "../features/business/service-orders/service-orders.swagger";
import { serviceOrderItemsSwagger } from "../features/business/service-order-items/service-order-items.swagger";
import { usersSwagger } from "../features/auth/users/users.swagger";
import { rolesSwagger } from "../features/auth/roles/roles.swagger";
import { resourcesSwagger } from "../features/auth/resources/resources.swagger";
import { roleUsersSwagger } from "../features/auth/role-users/role-users.swagger";
import { resourceRolesSwagger } from "../features/auth/resource-roles/resource-roles.swagger";
import { refreshTokensSwagger } from "../features/auth/refresh-tokens/refresh-tokens.swagger";

export type FeatureSwaggerModule = {
  tags: unknown[];
  paths: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown>; securitySchemes?: Record<string, unknown> };
};

/**
 * Registry de documentación: cada feature aporta su `*.swagger.ts`
 * (mismo patrón que el SeedersRunner).
 */
const featureSwaggerModules: FeatureSwaggerModule[] = [
  customersSwagger,
  garmentTypesSwagger,
  laundryServicesSwagger,
  serviceOrdersSwagger,
  serviceOrderItemsSwagger,
  usersSwagger,
  rolesSwagger,
  resourcesSwagger,
  roleUsersSwagger,
  resourceRolesSwagger,
  refreshTokensSwagger,
];

export function buildOpenApiDocument() {
  const tags: unknown[] = [];
  const paths: Record<string, unknown> = {};
  const schemas: Record<string, unknown> = { Error: errorSchema };
  const securitySchemes: Record<string, unknown> = { ...bearerSecurityScheme };

  for (const mod of featureSwaggerModules) {
    tags.push(...mod.tags);
    Object.assign(paths, secureByDefault(mod.paths));
    Object.assign(schemas, mod.components?.schemas ?? {});
    Object.assign(securitySchemes, mod.components?.securitySchemes ?? {});
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "TextilClean API",
      version: "1.0.0",
      description:
        "API de **TextilClean — Lavandería industrial** (Express 5 + Sequelize). " +
        "**Secure by default**: toda operación exige `Authorization: Bearer <access_token>` " +
        "salvo las marcadas como abiertas (login, refresh, logout). " +
        "Las rutas de negocio y de administración además requieren permiso RBAC (403 si no lo hay).",
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 4000}`, description: "Local" }],
    security: bearerSecurity,
    tags,
    paths,
    components: { schemas, securitySchemes },
  };
}

/**
 * Secure by default: a cada operación que no declare `security: []` (OPEN)
 * le agrega las respuestas 401 y 403. El requisito de Bearer viene del
 * `security` global del documento.
 */
function secureByDefault(paths: Record<string, unknown>): Record<string, unknown> {
  for (const pathItem of Object.values(paths) as Record<string, Record<string, unknown>>[]) {
    for (const operation of Object.values(pathItem)) {
      const isOpen = Array.isArray(operation.security) && operation.security.length === 0;
      if (isOpen) continue;
      const responses = (operation.responses ?? {}) as Record<string, unknown>;
      responses["401"] ??= unauthorizedResponse;
      if (operation["x-access"] !== "jwt") responses["403"] ??= forbiddenResponse;
      operation.responses = responses;
    }
  }
  return paths;
}

/** Monta Swagger UI en /api/docs y el JSON en /api/docs.json. */
export function setupSwagger(app: Application): void {
  const document = buildOpenApiDocument();
  app.get("/api/docs.json", (_req, res) => {
    res.json(document);
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(document, { customSiteTitle: "TextilClean API" }));
  console.log("📘 Swagger UI: /api/docs  |  OpenAPI JSON: /api/docs.json");
}
