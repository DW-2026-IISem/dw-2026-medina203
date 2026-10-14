import { Application } from "express";
import { authenticate } from "../access";
import { RefreshTokensController } from "./refresh-tokens.controller";

export class RefreshTokensRoutes {
  public refreshTokensController: RefreshTokensController = new RefreshTokensController();

  public routes(app: Application): void {
    app.route("/api/sesiones")
      .get(authenticate, this.refreshTokensController.getAll.bind(this.refreshTokensController))
      .delete(authenticate, this.refreshTokensController.purge.bind(this.refreshTokensController));

    app.route("/api/sesiones/deactivate-all")
      .patch(authenticate, this.refreshTokensController.revokeAll.bind(this.refreshTokensController));

    app.route("/api/sesiones/:id")
      .get(authenticate, this.refreshTokensController.getOne.bind(this.refreshTokensController));

    app.route("/api/sesiones/:id/deactivate")
      .patch(authenticate, this.refreshTokensController.revokeOne.bind(this.refreshTokensController));
  }
}