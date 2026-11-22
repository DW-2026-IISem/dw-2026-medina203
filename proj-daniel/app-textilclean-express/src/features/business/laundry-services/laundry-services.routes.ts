import { Application } from "express";
import { LaundryServicesController } from "./laundry-services.controller";

/** Rutas de LaundryServices — Fase I: SIN AUTH. */
export class LaundryServicesRoutes {
  public controller: LaundryServicesController = new LaundryServicesController();

  public routes(app: Application): void {
    const c = this.controller;

    app.route("/api/servicios")
      .get(c.getAll.bind(c))
      .post(c.create.bind(c));

    app.route("/api/servicios/:id")
      .get(c.getOne.bind(c))
      .put(c.updatePut.bind(c))
      .patch(c.updatePatch.bind(c))
      .delete(c.deletePhysical.bind(c));

    app.route("/api/servicios/:id/deactivate")
      .patch(c.deleteLogical.bind(c));
  }
}
