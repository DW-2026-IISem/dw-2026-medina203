import { Application } from "express";
import { UsersController } from "./users.controller";

/**
 * Rutas de Users.
 * Sin middlewares todavía: ISS-13 las protege con authenticate + authorize.
 */
export class UsersRoutes {
  public controller: UsersController = new UsersController();

  public routes(app: Application): void {
    const c = this.controller;

    app.route("/api/usuarios")
      .get(c.getAll.bind(c))
      .post(c.create.bind(c));

    app.route("/api/usuarios/:id")
      .get(c.getOne.bind(c))
      .put(c.updatePut.bind(c))
      .patch(c.updatePatch.bind(c))
      .delete(c.deletePhysical.bind(c));

    app.route("/api/usuarios/:id/deactivate").patch(c.deleteLogical.bind(c));
    app.route("/api/usuarios/:id/password").patch(c.changePassword.bind(c));
  }
}
