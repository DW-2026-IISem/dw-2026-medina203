import { Application } from "express";
import { GarmentTypesController } from "./garment-types.controller";

/** Rutas de GarmentTypes — Fase I: SIN AUTH. */
export class GarmentTypesRoutes {
  public controller: GarmentTypesController = new GarmentTypesController();

  public routes(app: Application): void {
    const c = this.controller;

    app.route("/api/tipos-prenda")
      .get(c.getAll.bind(c))
      .post(c.create.bind(c));

    app.route("/api/tipos-prenda/:id")
      .get(c.getOne.bind(c))
      .put(c.updatePut.bind(c))
      .patch(c.updatePatch.bind(c))
      .delete(c.deletePhysical.bind(c));

    app.route("/api/tipos-prenda/:id/deactivate")
      .patch(c.deleteLogical.bind(c));
  }
}
