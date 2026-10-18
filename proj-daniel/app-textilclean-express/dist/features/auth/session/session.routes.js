"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRoutes = void 0;
const access_1 = require("../access");
const session_controller_1 = require("./session.controller");
class SessionRoutes {
    constructor() {
        this.sessionController = new session_controller_1.SessionController();
    }
    routes(app) {
        app.route("/api/sesion/login").post(this.sessionController.login.bind(this.sessionController));
        app.route("/api/sesion/refresh").post(this.sessionController.refresh.bind(this.sessionController));
        app.route("/api/sesion/logout").post(this.sessionController.logout.bind(this.sessionController));
        app.route("/api/sesion/perfil").get(access_1.authenticate, this.sessionController.profile.bind(this.sessionController));
        app.route("/api/permisos").get(access_1.authenticate, this.sessionController.myPermissions.bind(this.sessionController));
    }
}
exports.SessionRoutes = SessionRoutes;
//# sourceMappingURL=session.routes.js.map