import { Application } from "express";
import { protect } from "../access";
import { RolesController } from "./roles.controller";

/** Rutas de Roles. JWT + RBAC (authenticate + authorize). */
export class RolesRoutes {
  public controller: RolesController = new RolesController();

  public routes(app: Application): void {
    const c = this.controller;
    app.route("/api/roles").get(...protect, c.getAll.bind(c)).post(...protect, c.create.bind(c));
    app.route("/api/roles/:id")
      .get(...protect, c.getOne.bind(c))
      .put(...protect, c.updatePut.bind(c))
      .patch(...protect, c.updatePatch.bind(c))
      .delete(...protect, c.deletePhysical.bind(c));
    app.route("/api/roles/:id/deactivate").patch(...protect, c.deleteLogical.bind(c));
  }
}
