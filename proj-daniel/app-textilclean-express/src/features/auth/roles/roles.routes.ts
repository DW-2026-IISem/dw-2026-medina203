import { Application } from "express";
import { RolesController } from "./roles.controller";

/** Rutas de Roles. Sin middlewares hasta ISS-13. */
export class RolesRoutes {
  public controller: RolesController = new RolesController();

  public routes(app: Application): void {
    const c = this.controller;
    app.route("/api/roles").get(c.getAll.bind(c)).post(c.create.bind(c));
    app.route("/api/roles/:id")
      .get(c.getOne.bind(c))
      .put(c.updatePut.bind(c))
      .patch(c.updatePatch.bind(c))
      .delete(c.deletePhysical.bind(c));
    app.route("/api/roles/:id/deactivate").patch(c.deleteLogical.bind(c));
  }
}
