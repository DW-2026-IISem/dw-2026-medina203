import { Application } from "express";
import { protect } from "../../auth/access";
import { ServiceOrdersController } from "./service-orders.controller";

/** Rutas de ServiceOrders — JWT + RBAC (authenticate + authorize). */
export class ServiceOrdersRoutes {
  public controller: ServiceOrdersController = new ServiceOrdersController();

  public routes(app: Application): void {
    const c = this.controller;

    app.route("/api/ordenes")
      .get(...protect, c.getAll.bind(c))
      .post(...protect, c.create.bind(c));

    app.route("/api/ordenes/:id")
      .get(...protect, c.getOne.bind(c))
      .put(...protect, c.updatePut.bind(c))
      .patch(...protect, c.updatePatch.bind(c))
      .delete(...protect, c.deletePhysical.bind(c));

    app.route("/api/ordenes/:id/estado")
      .patch(...protect, c.changeProcessStatus.bind(c));

    app.route("/api/ordenes/:id/deactivate")
      .patch(...protect, c.deleteLogical.bind(c));
  }
}
