import { Application } from "express";
import { ResourceRolesController } from "./resource-roles.controller";

// TODO ISS-13: añadir authenticate y authorize a todas las operaciones.
export class ResourceRolesRoutes {
  public resourceRolesController: ResourceRolesController = new ResourceRolesController();
  public routes(app: Application): void {
    app.route("/api/concesiones-rol").get(this.resourceRolesController.getAll.bind(this.resourceRolesController)).post(this.resourceRolesController.grant.bind(this.resourceRolesController));
    app.route("/api/concesiones-rol/:id").get(this.resourceRolesController.getOne.bind(this.resourceRolesController));
    app.route("/api/concesiones-rol/:id/deactivate").patch(this.resourceRolesController.deactivate.bind(this.resourceRolesController));
    app.route("/api/concesiones-rol/:id/reactivate").patch(this.resourceRolesController.reactivate.bind(this.resourceRolesController));
  }
}