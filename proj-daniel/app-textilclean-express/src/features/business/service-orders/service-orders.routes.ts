import { Application } from "express";
import { ServiceOrdersController } from "./service-orders.controller";

/** Rutas de ServiceOrders — Fase I: SIN AUTH. */
export class ServiceOrdersRoutes {
  public controller: ServiceOrdersController = new ServiceOrdersController();

  public routes(app: Application): void {
    const c = this.controller;

    app.route("/api/ordenes")
      .get(c.getAll.bind(c))
      .post(c.create.bind(c));

    app.route("/api/ordenes/:id")
      .get(c.getOne.bind(c))
      .put(c.updatePut.bind(c))
      .patch(c.updatePatch.bind(c))
      .delete(c.deletePhysical.bind(c));

    app.route("/api/ordenes/:id/estado")
      .patch(c.changeProcessStatus.bind(c));

    app.route("/api/ordenes/:id/deactivate")
      .patch(c.deleteLogical.bind(c));
  }
}
