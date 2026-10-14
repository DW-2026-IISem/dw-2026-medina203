import { Application } from "express";
import { UsersController } from "./users.controller";

// TODO ISS-13: proteger todas las operaciones con authenticate y authorize.
export class UsersRoutes {
  public usersController: UsersController = new UsersController();

  public routes(app: Application): void {
    app
      .route("/api/usuarios/:id/permisos")
      .get(this.usersController.getEffectivePermissions.bind(this.usersController));
    app.route("/api/usuarios").get(this.usersController.getAll.bind(this.usersController));
    app.route("/api/usuarios/:id").get(this.usersController.getOne.bind(this.usersController));
    app.route("/api/usuarios").post(this.usersController.create.bind(this.usersController));
    app
      .route("/api/usuarios/:id")
      .put(this.usersController.updatePut.bind(this.usersController))
      .patch(this.usersController.updatePatch.bind(this.usersController));
    app.route("/api/usuarios/:id").delete(this.usersController.deletePhysical.bind(this.usersController));
    app
      .route("/api/usuarios/:id/deactivate")
      .patch(this.usersController.deleteLogical.bind(this.usersController));
    app
      .route("/api/usuarios/:id/password")
      .patch(this.usersController.changePassword.bind(this.usersController));
  }
}