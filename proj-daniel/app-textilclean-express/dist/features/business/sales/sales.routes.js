"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesRoutes = void 0;
const sales_controller_1 = require("./sales.controller");
const access_1 = require("../../auth/access");
class SalesRoutes {
    constructor() {
        this.salesController = new sales_controller_1.SalesController();
    }
    routes(app) {
        app.route("/api/ventas").get(access_1.authenticate, access_1.authorize, this.salesController.getAll.bind(this.salesController));
        app.route("/api/ventas/:id").get(access_1.authenticate, access_1.authorize, this.salesController.getOne.bind(this.salesController));
        app.route("/api/ventas").post(access_1.authenticate, access_1.authorize, this.salesController.create.bind(this.salesController));
        app
            .route("/api/ventas/:id")
            .put(access_1.authenticate, access_1.authorize, this.salesController.updatePut.bind(this.salesController))
            .patch(access_1.authenticate, access_1.authorize, this.salesController.updatePatch.bind(this.salesController));
        app
            .route("/api/ventas/:id")
            .delete(access_1.authenticate, access_1.authorize, this.salesController.deletePhysical.bind(this.salesController));
        app
            .route("/api/ventas/:id/deactivate")
            .patch(access_1.authenticate, access_1.authorize, this.salesController.deleteLogical.bind(this.salesController));
    }
}
exports.SalesRoutes = SalesRoutes;
//# sourceMappingURL=sales.routes.js.map