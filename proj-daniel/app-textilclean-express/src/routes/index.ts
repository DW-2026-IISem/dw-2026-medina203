import { CustomersRoutes } from "../features/business/customers/customers.routes";

/**
 * Agregador de rutas de TextilClean.
 * Cada feature expone `XxxRoutes.routes(app)`; `App.routes()` las monta.
 */
export class Routes {
  public customersRoutes: CustomersRoutes = new CustomersRoutes();
}
