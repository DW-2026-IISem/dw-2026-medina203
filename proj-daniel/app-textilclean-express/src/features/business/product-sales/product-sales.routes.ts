import { Application } from "express";
import { ProductSalesController } from "./product-sales.controller";
import { authenticate, authorize } from "../../auth/access";

export class ProductSalesRoutes {
  public productSalesController: ProductSalesController = new ProductSalesController();

  public routes(app: Application): void {
    app
      .route("/api/detalle-ventas")
      .get(authenticate, authorize, this.productSalesController.getAll.bind(this.productSalesController));
    app
      .route("/api/detalle-ventas/:id")
      .get(authenticate, authorize, this.productSalesController.getOne.bind(this.productSalesController));
    app
      .route("/api/detalle-ventas")
      .post(authenticate, authorize, this.productSalesController.create.bind(this.productSalesController));
    app
      .route("/api/detalle-ventas/:id")
      .put(authenticate, authorize, this.productSalesController.updatePut.bind(this.productSalesController))
      .patch(authenticate, authorize, this.productSalesController.updatePatch.bind(this.productSalesController));
    app
      .route("/api/detalle-ventas/:id")
      .delete(authenticate, authorize, this.productSalesController.deletePhysical.bind(this.productSalesController));
    app
      .route("/api/detalle-ventas/:id/deactivate")
      .patch(authenticate, authorize, this.productSalesController.deleteLogical.bind(this.productSalesController));
  }
}