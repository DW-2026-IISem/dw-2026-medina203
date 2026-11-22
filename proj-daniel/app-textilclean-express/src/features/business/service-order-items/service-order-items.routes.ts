import { Application } from "express";
import { ServiceOrderItemsController } from "./service-order-items.controller";

/** Rutas de ServiceOrderItems — Fase I: SIN AUTH. */
export class ServiceOrderItemsRoutes {
  public controller: ServiceOrderItemsController = new ServiceOrderItemsController();

  public routes(app: Application): void {
    const c = this.controller;

    app.route("/api/detalle-ordenes")
      .get(c.getAll.bind(c))
      .post(c.create.bind(c));

    app.route("/api/detalle-ordenes/:id")
      .get(c.getOne.bind(c))
      .put(c.updatePut.bind(c))
      .patch(c.updatePatch.bind(c))
      .delete(c.deletePhysical.bind(c));

    app.route("/api/detalle-ordenes/:id/deactivate")
      .patch(c.deleteLogical.bind(c));
  }
}
