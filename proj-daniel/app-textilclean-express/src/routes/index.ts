import { CustomersRoutes } from "../features/business/customers/customers.routes";
import { GarmentTypesRoutes } from "../features/business/garment-types/garment-types.routes";
import { LaundryServicesRoutes } from "../features/business/laundry-services/laundry-services.routes";
import { ServiceOrdersRoutes } from "../features/business/service-orders/service-orders.routes";
import { ServiceOrderItemsRoutes } from "../features/business/service-order-items/service-order-items.routes";

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
}
