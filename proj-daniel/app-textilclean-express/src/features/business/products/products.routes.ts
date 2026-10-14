import { Application } from "express";
import { ProductsController } from "./products.controller";

export class ProductsRoutes {
  public productsController: ProductsController = new ProductsController();

  public routes(app: Application): void {
    app
      .route("/api/productos")
      .get(this.productsController.getAll.bind(this.productsController));

    app
      .route("/api/productos/:id")
      .get(this.productsController.getOne.bind(this.productsController));

    app
      .route("/api/productos")
      .post(this.productsController.create.bind(this.productsController));

    app
      .route("/api/productos/:id")
      .put(this.productsController.updatePut.bind(this.productsController))
      .patch(this.productsController.updatePatch.bind(this.productsController));

    app
      .route("/api/productos/:id")
      .delete(this.productsController.deletePhysical.bind(this.productsController));

    app
      .route("/api/productos/:id/deactivate")
      .patch(this.productsController.deleteLogical.bind(this.productsController));
  }
}