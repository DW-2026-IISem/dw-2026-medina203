"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsRoutes = void 0;
const clients_controller_1 = require("./clients.controller");
const access_1 = require("../../auth/access");
class ClientsRoutes {
    constructor() {
        this.clientsController = new clients_controller_1.ClientsController();
    }
    routes(app) {
        // ================== RUTAS SIN AUTENTICACIÓN / SIN MIDDLEWARE JWT ==================
        // getAll
        app
            .route("/api/clientes")
            .get(access_1.authenticate, access_1.authorize, this.clientsController.getAll.bind(this.clientsController));
        // getOne
        app
            .route("/api/clientes/:id")
            .get(access_1.authenticate, access_1.authorize, this.clientsController.getOne.bind(this.clientsController));
        // create
        app
            .route("/api/clientes")
            .post(access_1.authenticate, access_1.authorize, this.clientsController.create.bind(this.clientsController));
        // update (PUT / PATCH)
        app
            .route("/api/clientes/:id")
            .put(access_1.authenticate, access_1.authorize, this.clientsController.updatePut.bind(this.clientsController))
            .patch(access_1.authenticate, access_1.authorize, this.clientsController.updatePatch.bind(this.clientsController));
        // delete físico
        app
            .route("/api/clientes/:id")
            .delete(access_1.authenticate, access_1.authorize, this.clientsController.deletePhysical.bind(this.clientsController));
        // delete lógico
        app
            .route("/api/clientes/:id/deactivate")
            .patch(access_1.authenticate, access_1.authorize, this.clientsController.deleteLogical.bind(this.clientsController));
    }
}
exports.ClientsRoutes = ClientsRoutes;
//# sourceMappingURL=clients.routes.js.map