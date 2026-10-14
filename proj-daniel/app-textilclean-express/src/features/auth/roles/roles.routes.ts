import { Application } from "express";
import { RolesController } from "./roles.controller";

// TODO ISS-13: añadir authenticate y authorize a todas las operaciones.
export class RolesRoutes {
  public rolesController: RolesController = new RolesController();
  public routes(app: Application): void {
    app.route("/api/roles").get(this.rolesController.getAll.bind(this.rolesController)).post(this.rolesController.create.bind(this.rolesController));
    app.route("/api/roles/:id").get(this.rolesController.getOne.bind(this.rolesController)).put(this.rolesController.updatePut.bind(this.rolesController)).patch(this.rolesController.updatePatch.bind(this.rolesController)).delete(this.rolesController.deletePhysical.bind(this.rolesController));
    app.route("/api/roles/:id/deactivate").patch(this.rolesController.deleteLogical.bind(this.rolesController));
  }
}