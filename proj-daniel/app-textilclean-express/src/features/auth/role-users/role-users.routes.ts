import { Application } from "express";
import { RoleUsersController } from "./role-users.controller";

// TODO ISS-13: añadir authenticate y authorize a todas las operaciones.
export class RoleUsersRoutes {
  public roleUsersController: RoleUsersController = new RoleUsersController();
  public routes(app: Application): void {
    app.route("/api/asignaciones-rol").get(this.roleUsersController.getAll.bind(this.roleUsersController)).post(this.roleUsersController.assign.bind(this.roleUsersController));
    app.route("/api/asignaciones-rol/:id").get(this.roleUsersController.getOne.bind(this.roleUsersController));
    app.route("/api/asignaciones-rol/:id/deactivate").patch(this.roleUsersController.deactivate.bind(this.roleUsersController));
    app.route("/api/asignaciones-rol/:id/reactivate").patch(this.roleUsersController.reactivate.bind(this.roleUsersController));
  }
}