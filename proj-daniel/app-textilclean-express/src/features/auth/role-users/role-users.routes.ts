import { Application } from "express";
import { RoleUsersController } from "./role-users.controller";
import { authenticate, authorize } from "../access";

// TODO ISS-13: añadir authenticate y authorize a todas las operaciones.
export class RoleUsersRoutes {
  public roleUsersController: RoleUsersController = new RoleUsersController();
  public routes(app: Application): void {
    app.route("/api/asignaciones-rol").get(authenticate, authorize, this.roleUsersController.getAll.bind(this.roleUsersController)).post(authenticate, authorize, this.roleUsersController.assign.bind(this.roleUsersController));
    app.route("/api/asignaciones-rol/:id").get(authenticate, authorize, this.roleUsersController.getOne.bind(this.roleUsersController));
    app.route("/api/asignaciones-rol/:id/deactivate").patch(authenticate, authorize, this.roleUsersController.deactivate.bind(this.roleUsersController));
    app.route("/api/asignaciones-rol/:id/reactivate").patch(authenticate, authorize, this.roleUsersController.reactivate.bind(this.roleUsersController));
  }
}