"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourcesRoutes = void 0;
const resources_controller_1 = require("./resources.controller");
const access_1 = require("../access");
// TODO ISS-13: añadir authenticate y authorize a todas las operaciones.
class ResourcesRoutes {
    constructor() {
        this.resourcesController = new resources_controller_1.ResourcesController();
    }
    routes(app) {
        app.route("/api/recursos").get(access_1.authenticate, access_1.authorize, this.resourcesController.getAll.bind(this.resourcesController)).post(access_1.authenticate, access_1.authorize, this.resourcesController.create.bind(this.resourcesController));
        app.route("/api/recursos/:id").get(access_1.authenticate, access_1.authorize, this.resourcesController.getOne.bind(this.resourcesController)).put(access_1.authenticate, access_1.authorize, this.resourcesController.updatePut.bind(this.resourcesController)).patch(access_1.authenticate, access_1.authorize, this.resourcesController.updatePatch.bind(this.resourcesController)).delete(access_1.authenticate, access_1.authorize, this.resourcesController.deletePhysical.bind(this.resourcesController));
        app.route("/api/recursos/:id/deactivate").patch(access_1.authenticate, access_1.authorize, this.resourcesController.deleteLogical.bind(this.resourcesController));
    }
}
exports.ResourcesRoutes = ResourcesRoutes;
//# sourceMappingURL=resources.routes.js.map