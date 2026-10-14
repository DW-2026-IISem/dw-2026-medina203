import { Application } from "express";
import { SalesController } from "./sales.controller";
import { authenticate, authorize } from "../../auth/access";

export class SalesRoutes {
  public salesController: SalesController = new SalesController();

  public routes(app: Application): void {
    app.route("/api/ventas").get(authenticate, authorize, this.salesController.getAll.bind(this.salesController));
    app.route("/api/ventas/:id").get(authenticate, authorize, this.salesController.getOne.bind(this.salesController));
    app.route("/api/ventas").post(authenticate, authorize, this.salesController.create.bind(this.salesController));
    app
      .route("/api/ventas/:id")
      .put(authenticate, authorize, this.salesController.updatePut.bind(this.salesController))
      .patch(authenticate, authorize, this.salesController.updatePatch.bind(this.salesController));
    app
      .route("/api/ventas/:id")
      .delete(authenticate, authorize, this.salesController.deletePhysical.bind(this.salesController));
    app
      .route("/api/ventas/:id/deactivate")
      .patch(authenticate, authorize, this.salesController.deleteLogical.bind(this.salesController));
  }
}