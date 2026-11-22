import { Application } from "express";
import { RoleUsersController } from "./role-users.controller";

/** Rutas de RoleUsers (asignaciones usuario-rol). Sin middlewares hasta ISS-13. */
export class RoleUsersRoutes {
  public controller: RoleUsersController = new RoleUsersController();

  public routes(app: Application): void {
    const c = this.controller;
    app.route("/api/asignaciones-rol").get(c.getAll.bind(c)).post(c.assign.bind(c));
    app.route("/api/asignaciones-rol/:id").get(c.getOne.bind(c));
    app.route("/api/asignaciones-rol/:id/deactivate").patch(c.deactivate.bind(c));
    app.route("/api/asignaciones-rol/:id/reactivate").patch(c.reactivate.bind(c));
  }
}
