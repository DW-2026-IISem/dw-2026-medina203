"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleUsersRoutes = void 0;
const role_users_controller_1 = require("./role-users.controller");
const access_1 = require("../access");
// TODO ISS-13: añadir authenticate y authorize a todas las operaciones.
class RoleUsersRoutes {
    constructor() {
        this.roleUsersController = new role_users_controller_1.RoleUsersController();
    }
    routes(app) {
        app.route("/api/asignaciones-rol").get(access_1.authenticate, access_1.authorize, this.roleUsersController.getAll.bind(this.roleUsersController)).post(access_1.authenticate, access_1.authorize, this.roleUsersController.assign.bind(this.roleUsersController));
        app.route("/api/asignaciones-rol/:id").get(access_1.authenticate, access_1.authorize, this.roleUsersController.getOne.bind(this.roleUsersController));
        app.route("/api/asignaciones-rol/:id/deactivate").patch(access_1.authenticate, access_1.authorize, this.roleUsersController.deactivate.bind(this.roleUsersController));
        app.route("/api/asignaciones-rol/:id/reactivate").patch(access_1.authenticate, access_1.authorize, this.roleUsersController.reactivate.bind(this.roleUsersController));
    }
}
exports.RoleUsersRoutes = RoleUsersRoutes;
//# sourceMappingURL=role-users.routes.js.map