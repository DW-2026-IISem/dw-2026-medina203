import { Application } from "express";
import { ProductSalesController } from "./product-sales.controller";

export class ProductSalesRoutes {
  public productSalesController: ProductSalesController = new ProductSalesController();

  public routes(app: Application): void {
    app
      .route("/api/detalle-ventas")
      .get(this.productSalesController.getAll.bind(this.productSalesController));
    app
      .route("/api/detalle-ventas/:id")
      .get(this.productSalesController.getOne.bind(this.productSalesController));
    app
      .route("/api/detalle-ventas")
      .post(this.productSalesController.create.bind(this.productSalesController));
    app
      .route("/api/detalle-ventas/:id")
      .put(this.productSalesController.updatePut.bind(this.productSalesController))
      .patch(this.productSalesController.updatePatch.bind(this.productSalesController));
    app
      .route("/api/detalle-ventas/:id")
      .delete(this.productSalesController.deletePhysical.bind(this.productSalesController));
    app
      .route("/api/detalle-ventas/:id/deactivate")
      .patch(this.productSalesController.deleteLogical.bind(this.productSalesController));
  }
}