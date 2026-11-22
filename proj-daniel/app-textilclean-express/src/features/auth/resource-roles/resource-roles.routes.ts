import { Application } from "express";
import { ResourceRolesController } from "./resource-roles.controller";

/** Rutas de ResourceRoles (concesiones rol-recurso). Sin middlewares hasta ISS-13. */
export class ResourceRolesRoutes {
  public controller: ResourceRolesController = new ResourceRolesController();

  public routes(app: Application): void {
    const c = this.controller;
    app.route("/api/concesiones-rol").get(c.getAll.bind(c)).post(c.grant.bind(c));
    app.route("/api/concesiones-rol/:id").get(c.getOne.bind(c));
    app.route("/api/concesiones-rol/:id/deactivate").patch(c.deactivate.bind(c));
    app.route("/api/concesiones-rol/:id/reactivate").patch(c.reactivate.bind(c));
  }
}
