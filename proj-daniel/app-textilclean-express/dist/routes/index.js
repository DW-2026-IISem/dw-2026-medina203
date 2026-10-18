"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Routes = void 0;
const clients_routes_1 = require("../features/business/clients/clients.routes");
const product_types_routes_1 = require("../features/business/product-types/product-types.routes");
const products_routes_1 = require("../features/business/products/products.routes");
const sales_routes_1 = require("../features/business/sales/sales.routes");
const product_sales_routes_1 = require("../features/business/product-sales/product-sales.routes");
const users_routes_1 = require("../features/auth/users/users.routes");
const roles_routes_1 = require("../features/auth/roles/roles.routes");
const resources_routes_1 = require("../features/auth/resources/resources.routes");
const role_users_routes_1 = require("../features/auth/role-users/role-users.routes");
const resource_roles_routes_1 = require("../features/auth/resource-roles/resource-roles.routes");
const refresh_tokens_routes_1 = require("../features/auth/refresh-tokens/refresh-tokens.routes");
const session_routes_1 = require("../features/auth/session/session.routes");
class Routes {
    constructor() {
        this.clientsRoutes = new clients_routes_1.ClientsRoutes();
        this.productTypesRoutes = new product_types_routes_1.ProductTypesRoutes();
        this.productsRoutes = new products_routes_1.ProductsRoutes();
        this.salesRoutes = new sales_routes_1.SalesRoutes();
        this.productSalesRoutes = new product_sales_routes_1.ProductSalesRoutes();
        this.usersRoutes = new users_routes_1.UsersRoutes();
        this.rolesRoutes = new roles_routes_1.RolesRoutes();
        this.resourcesRoutes = new resources_routes_1.ResourcesRoutes();
        this.roleUsersRoutes = new role_users_routes_1.RoleUsersRoutes();
        this.resourceRolesRoutes = new resource_roles_routes_1.ResourceRolesRoutes();
        this.refreshTokensRoutes = new refresh_tokens_routes_1.RefreshTokensRoutes();
        this.sessionRoutes = new session_routes_1.SessionRoutes();
    }
}
exports.Routes = Routes;
//# sourceMappingURL=index.js.map