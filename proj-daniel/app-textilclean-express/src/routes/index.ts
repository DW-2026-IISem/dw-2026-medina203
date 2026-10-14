import { ClientsRoutes } from "../features/business/clients/clients.routes";
import { ProductTypesRoutes } from "../features/business/product-types/product-types.routes";
import { ProductsRoutes } from "../features/business/products/products.routes";
import { SalesRoutes } from "../features/business/sales/sales.routes";
import { ProductSalesRoutes } from "../features/business/product-sales/product-sales.routes";
import { UsersRoutes } from "../features/auth/users/users.routes";
import { RolesRoutes } from "../features/auth/roles/roles.routes";
import { ResourcesRoutes } from "../features/auth/resources/resources.routes";
import { RoleUsersRoutes } from "../features/auth/role-users/role-users.routes";
import { ResourceRolesRoutes } from "../features/auth/resource-roles/resource-roles.routes";

export class Routes {
  public clientsRoutes: ClientsRoutes = new ClientsRoutes();
  public productTypesRoutes: ProductTypesRoutes = new ProductTypesRoutes();
  public productsRoutes: ProductsRoutes = new ProductsRoutes();
  public salesRoutes: SalesRoutes = new SalesRoutes();
  public productSalesRoutes: ProductSalesRoutes = new ProductSalesRoutes();
  public usersRoutes: UsersRoutes = new UsersRoutes();
  public rolesRoutes: RolesRoutes = new RolesRoutes();
  public resourcesRoutes: ResourcesRoutes = new ResourcesRoutes();
  public roleUsersRoutes: RoleUsersRoutes = new RoleUsersRoutes();
  public resourceRolesRoutes: ResourceRolesRoutes = new ResourceRolesRoutes();
  
}
