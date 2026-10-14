import { ClientsRoutes } from "../features/business/clients/clients.routes";
import { ProductTypesRoutes } from "../features/business/product-types/product-types.routes";
import { ProductsRoutes } from "../features/business/products/products.routes";
import { SalesRoutes } from "../features/business/sales/sales.routes";
import { ProductSalesRoutes } from "../features/business/product-sales/product-sales.routes";
import { UsersRoutes } from "../features/auth/users/users.routes";

export class Routes {
  public clientsRoutes: ClientsRoutes = new ClientsRoutes();
  public productTypesRoutes: ProductTypesRoutes = new ProductTypesRoutes();
  public productsRoutes: ProductsRoutes = new ProductsRoutes();
  public salesRoutes: SalesRoutes = new SalesRoutes();
  public productSalesRoutes: ProductSalesRoutes = new ProductSalesRoutes();
  public usersRoutes: UsersRoutes = new UsersRoutes();
  
}
