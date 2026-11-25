import { Application } from "express";
import { protect } from "../access";
import { RoleUsersController } from "./role-users.controller";

/** Rutas de RoleUsers (asignaciones usuario-rol). JWT + RBAC (authenticate + authorize). */
export class RoleUsersRoutes {
  public controller: RoleUsersController = new RoleUsersController();

  public routes(app: Application): void {
    const c = this.controller;
    app.route("/api/asignaciones-rol").get(...protect, c.getAll.bind(c)).post(...protect, c.assign.bind(c));
    app.route("/api/asignaciones-rol/:id").get(...protect, c.getOne.bind(c));
    app.route("/api/asignaciones-rol/:id/deactivate").patch(...protect, c.deactivate.bind(c));
    app.route("/api/asignaciones-rol/:id/reactivate").patch(...protect, c.reactivate.bind(c));
  }
}
