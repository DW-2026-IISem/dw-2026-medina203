"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOpenApiDocument = buildOpenApiDocument;
exports.setupSwagger = setupSwagger;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const clients_swagger_1 = require("../features/business/clients/clients.swagger");
const product_types_swagger_1 = require("../features/business/product-types/product-types.swagger");
const products_swagger_1 = require("../features/business/products/products.swagger");
const sales_swagger_1 = require("../features/business/sales/sales.swagger");
const product_sales_swagger_1 = require("../features/business/product-sales/product-sales.swagger");
const users_swagger_1 = require("../features/auth/users/users.swagger");
const roles_swagger_1 = require("../features/auth/roles/roles.swagger");
const resources_swagger_1 = require("../features/auth/resources/resources.swagger");
const role_users_swagger_1 = require("../features/auth/role-users/role-users.swagger");
const resource_roles_swagger_1 = require("../features/auth/resource-roles/resource-roles.swagger");
const refresh_tokens_swagger_1 = require("../features/auth/refresh-tokens/refresh-tokens.swagger");
const session_swagger_1 = require("../features/auth/session/session.swagger");
/**
 * Registry externo: importa la documentación OpenAPI de cada feature
 * (mismo patrón que SeedersRunner).
 */
const featureSwaggerModules = [
    clients_swagger_1.clientsSwagger,
    product_types_swagger_1.productTypesSwagger,
    products_swagger_1.productsSwagger,
    sales_swagger_1.salesSwagger,
    product_sales_swagger_1.productSalesSwagger,
    users_swagger_1.usersSwagger,
    roles_swagger_1.rolesSwagger,
    resources_swagger_1.resourcesSwagger,
    role_users_swagger_1.roleUsersSwagger,
    resource_roles_swagger_1.resourceRolesSwagger,
    refresh_tokens_swagger_1.refreshTokensSwagger,
    session_swagger_1.sessionSwagger,
];
function buildOpenApiDocument() {
    const tags = [];
    const paths = {};
    const schemas = {};
    const securitySchemes = {};
    for (const mod of featureSwaggerModules) {
        tags.push(...mod.tags);
        Object.assign(paths, mod.paths);
        if (mod.components?.schemas) {
            Object.assign(schemas, mod.components.schemas);
        }
        if (mod.components?.securitySchemes) {
            Object.assign(securitySchemes, mod.components.securitySchemes);
        }
    }
    return {
        openapi: "3.0.3",
        info: {
            title: "TextilClean API",
            version: "1.0.0",
            description: "API TextilClean (Express + Sequelize). Fase I Business — **SIN AUTH**.",
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 4000}`,
                description: "Local",
            },
        ],
        tags,
        paths,
        components: { schemas, securitySchemes },
    };
}
/** Monta Swagger UI y el JSON OpenAPI */
function setupSwagger(app) {
    const document = buildOpenApiDocument();
    app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(document));
    app.get("/api/docs.json", (_req, res) => {
        res.json(document);
    });
    console.log("📘 Swagger UI: /api/docs  |  OpenAPI JSON: /api/docs.json");
}
//# sourceMappingURL=index.js.map