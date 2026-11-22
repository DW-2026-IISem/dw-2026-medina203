import { CustomersRoutes } from "../features/business/customers/customers.routes";
import { GarmentTypesRoutes } from "../features/business/garment-types/garment-types.routes";
import { LaundryServicesRoutes } from "../features/business/laundry-services/laundry-services.routes";
import { ServiceOrdersRoutes } from "../features/business/service-orders/service-orders.routes";
import { ServiceOrderItemsRoutes } from "../features/business/service-order-items/service-order-items.routes";
import { UsersRoutes } from "../features/auth/users/users.routes";
import { RolesRoutes } from "../features/auth/roles/roles.routes";
import { ResourcesRoutes } from "../features/auth/resources/resources.routes";
import { RoleUsersRoutes } from "../features/auth/role-users/role-users.routes";
import { ResourceRolesRoutes } from "../features/auth/resource-roles/resource-roles.routes";
import { RefreshTokensRoutes } from "../features/auth/refresh-tokens/refresh-tokens.routes";

/**
 * Agregador de rutas de TextilClean.
 * Cada feature expone `XxxRoutes.routes(app)`; `App.routes()` las monta.
 */
export class Routes {
  public customersRoutes: CustomersRoutes = new CustomersRoutes();
  public garmentTypesRoutes: GarmentTypesRoutes = new GarmentTypesRoutes();
  public laundryServicesRoutes: LaundryServicesRoutes = new LaundryServicesRoutes();
  public serviceOrdersRoutes: ServiceOrdersRoutes = new ServiceOrdersRoutes();
  public serviceOrderItemsRoutes: ServiceOrderItemsRoutes = new ServiceOrderItemsRoutes();
  // Auth
  public usersRoutes: UsersRoutes = new UsersRoutes();
  public rolesRoutes: RolesRoutes = new RolesRoutes();
  public resourcesRoutes: ResourcesRoutes = new ResourcesRoutes();
  public roleUsersRoutes: RoleUsersRoutes = new RoleUsersRoutes();
  public resourceRolesRoutes: ResourceRolesRoutes = new ResourceRolesRoutes();
  public refreshTokensRoutes: RefreshTokensRoutes = new RefreshTokensRoutes();
}
