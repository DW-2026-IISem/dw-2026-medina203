import { Application } from "express";
import { protect } from "../../auth/access";
import { ServiceOrderItemsController } from "./service-order-items.controller";

/** Rutas de ServiceOrderItems — JWT + RBAC (authenticate + authorize). */
export class ServiceOrderItemsRoutes {
  public controller: ServiceOrderItemsController = new ServiceOrderItemsController();

  public routes(app: Application): void {
    const c = this.controller;

    app.route("/api/detalle-ordenes")
      .get(...protect, c.getAll.bind(c))
      .post(...protect, c.create.bind(c));

    app.route("/api/detalle-ordenes/:id")
      .get(...protect, c.getOne.bind(c))
      .put(...protect, c.updatePut.bind(c))
      .patch(...protect, c.updatePatch.bind(c))
      .delete(...protect, c.deletePhysical.bind(c));

    app.route("/api/detalle-ordenes/:id/deactivate")
      .patch(...protect, c.deleteLogical.bind(c));
  }
}
