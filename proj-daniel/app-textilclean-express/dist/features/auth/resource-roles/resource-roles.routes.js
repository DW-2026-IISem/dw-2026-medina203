"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceRolesRoutes = void 0;
const resource_roles_controller_1 = require("./resource-roles.controller");
const access_1 = require("../access");
// TODO ISS-13: añadir authenticate y authorize a todas las operaciones.
class ResourceRolesRoutes {
    constructor() {
        this.resourceRolesController = new resource_roles_controller_1.ResourceRolesController();
    }
    routes(app) {
        app.route("/api/concesiones-rol").get(access_1.authenticate, access_1.authorize, this.resourceRolesController.getAll.bind(this.resourceRolesController)).post(access_1.authenticate, access_1.authorize, this.resourceRolesController.grant.bind(this.resourceRolesController));
        app.route("/api/concesiones-rol/:id").get(access_1.authenticate, access_1.authorize, this.resourceRolesController.getOne.bind(this.resourceRolesController));
        app.route("/api/concesiones-rol/:id/deactivate").patch(access_1.authenticate, access_1.authorize, this.resourceRolesController.deactivate.bind(this.resourceRolesController));
        app.route("/api/concesiones-rol/:id/reactivate").patch(access_1.authenticate, access_1.authorize, this.resourceRolesController.reactivate.bind(this.resourceRolesController));
    }
}
exports.ResourceRolesRoutes = ResourceRolesRoutes;
//# sourceMappingURL=resource-roles.routes.js.map