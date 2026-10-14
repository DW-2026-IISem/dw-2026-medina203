import { Application } from "express";
import { ProductsController } from "./products.controller";
import { authenticate, authorize } from "../../auth/access";

export class ProductsRoutes {
  public productsController: ProductsController = new ProductsController();

  public routes(app: Application): void {
    app
      .route("/api/productos")
      .get(authenticate, authorize, this.productsController.getAll.bind(this.productsController));

    app
      .route("/api/productos/:id")
      .get(authenticate, authorize, this.productsController.getOne.bind(this.productsController));

    app
      .route("/api/productos")
      .post(authenticate, authorize, this.productsController.create.bind(this.productsController));

    app
      .route("/api/productos/:id")
      .put(authenticate, authorize, this.productsController.updatePut.bind(this.productsController))
      .patch(authenticate, authorize, this.productsController.updatePatch.bind(this.productsController));

    app
      .route("/api/productos/:id")
      .delete(authenticate, authorize, this.productsController.deletePhysical.bind(this.productsController));

    app
      .route("/api/productos/:id/deactivate")
      .patch(authenticate, authorize, this.productsController.deleteLogical.bind(this.productsController));
  }
}