import { Application } from "express";
import { protect } from "../access";
import { ResourceRolesController } from "./resource-roles.controller";

/** Rutas de ResourceRoles (concesiones rol-recurso). JWT + RBAC (authenticate + authorize). */
export class ResourceRolesRoutes {
  public controller: ResourceRolesController = new ResourceRolesController();

  public routes(app: Application): void {
    const c = this.controller;
    app.route("/api/concesiones-rol").get(...protect, c.getAll.bind(c)).post(...protect, c.grant.bind(c));
    app.route("/api/concesiones-rol/:id").get(...protect, c.getOne.bind(c));
    app.route("/api/concesiones-rol/:id/deactivate").patch(...protect, c.deactivate.bind(c));
    app.route("/api/concesiones-rol/:id/reactivate").patch(...protect, c.reactivate.bind(c));
  }
}
