"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesRoutes = void 0;
const roles_controller_1 = require("./roles.controller");
const access_1 = require("../access");
// TODO ISS-13: añadir authenticate y authorize a todas las operaciones.
class RolesRoutes {
    constructor() {
        this.rolesController = new roles_controller_1.RolesController();
    }
    routes(app) {
        app.route("/api/roles").get(access_1.authenticate, access_1.authorize, this.rolesController.getAll.bind(this.rolesController)).post(access_1.authenticate, access_1.authorize, this.rolesController.create.bind(this.rolesController));
        app.route("/api/roles/:id").get(access_1.authenticate, access_1.authorize, this.rolesController.getOne.bind(this.rolesController)).put(access_1.authenticate, access_1.authorize, this.rolesController.updatePut.bind(this.rolesController)).patch(access_1.authenticate, access_1.authorize, this.rolesController.updatePatch.bind(this.rolesController)).delete(access_1.authenticate, access_1.authorize, this.rolesController.deletePhysical.bind(this.rolesController));
        app.route("/api/roles/:id/deactivate").patch(access_1.authenticate, access_1.authorize, this.rolesController.deleteLogical.bind(this.rolesController));
    }
}
exports.RolesRoutes = RolesRoutes;
//# sourceMappingURL=roles.routes.js.map