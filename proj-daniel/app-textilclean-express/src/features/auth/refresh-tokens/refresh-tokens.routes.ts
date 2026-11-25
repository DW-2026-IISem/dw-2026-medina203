import { Application } from "express";
import { jwtOnly } from "../access";
import { RefreshTokensController } from "./refresh-tokens.controller";

/**
 * Rutas de sesiones propias — modalidad **JWT** (sin RBAC): cualquier usuario
 * autenticado gestiona SUS sesiones; no aparecen en el catálogo de recursos.
 */
export class RefreshTokensRoutes {
  public controller: RefreshTokensController = new RefreshTokensController();

  public routes(app: Application): void {
    const c = this.controller;
    app.route("/api/sesiones")
      .get(...jwtOnly, c.getAll.bind(c))
      .delete(...jwtOnly, c.purge.bind(c));
    app.route("/api/sesiones/deactivate-all").patch(...jwtOnly, c.revokeAll.bind(c));
    app.route("/api/sesiones/:id").get(...jwtOnly, c.getOne.bind(c));
    app.route("/api/sesiones/:id/deactivate").patch(...jwtOnly, c.revokeOne.bind(c));
  }
}
