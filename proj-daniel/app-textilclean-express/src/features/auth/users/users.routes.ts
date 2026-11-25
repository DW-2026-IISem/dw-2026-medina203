import { Application } from "express";
import { protect } from "../access";
import { UsersController } from "./users.controller";

/**
 * Rutas de Users.
 * JWT + RBAC (authenticate + authorize).
 */
export class UsersRoutes {
  public controller: UsersController = new UsersController();

  public routes(app: Application): void {
    const c = this.controller;

    app.route("/api/usuarios")
      .get(...protect, c.getAll.bind(c))
      .post(...protect, c.create.bind(c));

    app.route("/api/usuarios/:id")
      .get(...protect, c.getOne.bind(c))
      .put(...protect, c.updatePut.bind(c))
      .patch(...protect, c.updatePatch.bind(c))
      .delete(...protect, c.deletePhysical.bind(c));

    app.route("/api/usuarios/:id/deactivate").patch(...protect, c.deleteLogical.bind(c));
    app.route("/api/usuarios/:id/password").patch(...protect, c.changePassword.bind(c));
    app.route("/api/usuarios/:id/permisos").get(...protect, c.getEffectivePermissions.bind(c));
  }
}
