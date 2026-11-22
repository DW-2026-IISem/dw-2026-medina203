import { CustomersRoutes } from "../features/business/customers/customers.routes";
import { GarmentTypesRoutes } from "../features/business/garment-types/garment-types.routes";

/**
 * Agregador de rutas de TextilClean.
 * Cada feature expone `XxxRoutes.routes(app)`; `App.routes()` las monta.
 */
export class Routes {
  public customersRoutes: CustomersRoutes = new CustomersRoutes();
  public garmentTypesRoutes: GarmentTypesRoutes = new GarmentTypesRoutes();
}
