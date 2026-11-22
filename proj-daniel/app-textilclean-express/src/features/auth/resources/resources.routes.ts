import { Application } from "express";
import { ResourcesController } from "./resources.controller";

/** Rutas de Resources. Sin middlewares hasta ISS-13. */
export class ResourcesRoutes {
  public controller: ResourcesController = new ResourcesController();

  public routes(app: Application): void {
    const c = this.controller;
    app.route("/api/recursos").get(c.getAll.bind(c)).post(c.create.bind(c));
    app.route("/api/recursos/:id")
      .get(c.getOne.bind(c))
      .put(c.updatePut.bind(c))
      .patch(c.updatePatch.bind(c))
      .delete(c.deletePhysical.bind(c));
    app.route("/api/recursos/:id/deactivate").patch(c.deleteLogical.bind(c));
  }
}
