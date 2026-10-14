import { Application } from "express";
import { ResourceRolesController } from "./resource-roles.controller";
import { authenticate, authorize } from "../access";

// TODO ISS-13: añadir authenticate y authorize a todas las operaciones.
export class ResourceRolesRoutes {
  public resourceRolesController: ResourceRolesController = new ResourceRolesController();
  public routes(app: Application): void {
    app.route("/api/concesiones-rol").get(authenticate, authorize, this.resourceRolesController.getAll.bind(this.resourceRolesController)).post(authenticate, authorize, this.resourceRolesController.grant.bind(this.resourceRolesController));
    app.route("/api/concesiones-rol/:id").get(authenticate, authorize, this.resourceRolesController.getOne.bind(this.resourceRolesController));
    app.route("/api/concesiones-rol/:id/deactivate").patch(authenticate, authorize, this.resourceRolesController.deactivate.bind(this.resourceRolesController));
    app.route("/api/concesiones-rol/:id/reactivate").patch(authenticate, authorize, this.resourceRolesController.reactivate.bind(this.resourceRolesController));
  }
}