import { Application } from "express";
import { SalesController } from "./sales.controller";

export class SalesRoutes {
  public salesController: SalesController = new SalesController();

  public routes(app: Application): void {
    app.route("/api/ventas").get(this.salesController.getAll.bind(this.salesController));
    app.route("/api/ventas/:id").get(this.salesController.getOne.bind(this.salesController));
    app.route("/api/ventas").post(this.salesController.create.bind(this.salesController));
    app
      .route("/api/ventas/:id")
      .put(this.salesController.updatePut.bind(this.salesController))
      .patch(this.salesController.updatePatch.bind(this.salesController));
    app
      .route("/api/ventas/:id")
      .delete(this.salesController.deletePhysical.bind(this.salesController));
    app
      .route("/api/ventas/:id/deactivate")
      .patch(this.salesController.deleteLogical.bind(this.salesController));
  }
}