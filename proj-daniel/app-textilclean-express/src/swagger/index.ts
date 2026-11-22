import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { errorSchema } from "../shared/http/swagger-common";
import { customersSwagger } from "../features/business/customers/customers.swagger";
import { garmentTypesSwagger } from "../features/business/garment-types/garment-types.swagger";

export type FeatureSwaggerModule = {
  tags: unknown[];
  paths: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown>; securitySchemes?: Record<string, unknown> };
};

/**
 * Registry de documentación: cada feature aporta su `*.swagger.ts`
 * (mismo patrón que el SeedersRunner).
 */
const featureSwaggerModules: FeatureSwaggerModule[] = [customersSwagger, garmentTypesSwagger];

export function buildOpenApiDocument() {
  const tags: unknown[] = [];
  const paths: Record<string, unknown> = {};
  const schemas: Record<string, unknown> = { Error: errorSchema };
  const securitySchemes: Record<string, unknown> = {};

  for (const mod of featureSwaggerModules) {
    tags.push(...mod.tags);
    Object.assign(paths, mod.paths);
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
        "Fase I Business — **SIN AUTH**.",
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 4000}`, description: "Local" }],
    tags,
    paths,
    components: { schemas, securitySchemes },
  };
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
