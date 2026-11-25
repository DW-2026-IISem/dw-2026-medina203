import { Application } from "express";
import { jwtOnly } from "../access";
import { SessionController } from "./session.controller";

/**
 * Rutas de Session:
 * - **OPEN**: login, refresh y logout (no hay identidad previa).
 * - **JWT**: perfil y permisos propios.
 */
export class SessionRoutes {
  public controller: SessionController = new SessionController();

  public routes(app: Application): void {
    const c = this.controller;
    // OPEN
    app.route("/api/sesion/login").post(c.login.bind(c));
    app.route("/api/sesion/refresh").post(c.refresh.bind(c));
    app.route("/api/sesion/logout").post(c.logout.bind(c));
    // JWT
    app.route("/api/sesion/perfil").get(...jwtOnly, c.profile.bind(c));
    app.route("/api/permisos").get(...jwtOnly, c.myPermissions.bind(c));
  }
}
