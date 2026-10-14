import { ClientsRoutes } from "../features/business/clients/clients.routes";
import { ProductTypesRoutes } from "../features/business/product-types/product-types.routes";

export class Routes {
  public clientsRoutes: ClientsRoutes = new ClientsRoutes();
  public productTypesRoutes: ProductTypesRoutes = new ProductTypesRoutes();
}
