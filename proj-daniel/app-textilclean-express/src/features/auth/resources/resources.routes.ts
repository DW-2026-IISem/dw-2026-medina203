import { Application } from "express";
import { protect } from "../access";
import { ResourcesController } from "./resources.controller";

/** Rutas de Resources. JWT + RBAC (authenticate + authorize). */
export class ResourcesRoutes {
  public controller: ResourcesController = new ResourcesController();

  public routes(app: Application): void {
    const c = this.controller;
    app.route("/api/recursos").get(...protect, c.getAll.bind(c)).post(...protect, c.create.bind(c));
    app.route("/api/recursos/:id")
      .get(...protect, c.getOne.bind(c))
      .put(...protect, c.updatePut.bind(c))
      .patch(...protect, c.updatePatch.bind(c))
      .delete(...protect, c.deletePhysical.bind(c));
    app.route("/api/recursos/:id/deactivate").patch(...protect, c.deleteLogical.bind(c));
  }
}
