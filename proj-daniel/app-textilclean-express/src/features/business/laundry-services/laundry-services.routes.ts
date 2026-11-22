import { Application } from "express";
import { protect } from "../../auth/access";
import { LaundryServicesController } from "./laundry-services.controller";

/** Rutas de LaundryServices — JWT + RBAC (authenticate + authorize). */
export class LaundryServicesRoutes {
  public controller: LaundryServicesController = new LaundryServicesController();

  public routes(app: Application): void {
    const c = this.controller;

    app.route("/api/servicios")
      .get(...protect, c.getAll.bind(c))
      .post(...protect, c.create.bind(c));

    app.route("/api/servicios/:id")
      .get(...protect, c.getOne.bind(c))
      .put(...protect, c.updatePut.bind(c))
      .patch(...protect, c.updatePatch.bind(c))
      .delete(...protect, c.deletePhysical.bind(c));

    app.route("/api/servicios/:id/deactivate")
      .patch(...protect, c.deleteLogical.bind(c));
  }
}
