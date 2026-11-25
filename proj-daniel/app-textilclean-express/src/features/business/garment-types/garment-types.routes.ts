import { Application } from "express";
import { protect } from "../../auth/access";
import { GarmentTypesController } from "./garment-types.controller";

/** Rutas de GarmentTypes — JWT + RBAC (authenticate + authorize). */
export class GarmentTypesRoutes {
  public controller: GarmentTypesController = new GarmentTypesController();

  public routes(app: Application): void {
    const c = this.controller;

    app.route("/api/tipos-prenda")
      .get(...protect, c.getAll.bind(c))
      .post(...protect, c.create.bind(c));

    app.route("/api/tipos-prenda/:id")
      .get(...protect, c.getOne.bind(c))
      .put(...protect, c.updatePut.bind(c))
      .patch(...protect, c.updatePatch.bind(c))
      .delete(...protect, c.deletePhysical.bind(c));

    app.route("/api/tipos-prenda/:id/deactivate")
      .patch(...protect, c.deleteLogical.bind(c));
  }
}
