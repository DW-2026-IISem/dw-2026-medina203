"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductTypesRoutes = void 0;
const product_types_controller_1 = require("./product-types.controller");
const access_1 = require("../../auth/access");
class ProductTypesRoutes {
    constructor() {
        this.productTypesController = new product_types_controller_1.ProductTypesController();
    }
    routes(app) {
        // ================== RUTAS SIN AUTENTICACIÓN / SIN MIDDLEWARE JWT ==================
        // getAll
        app
            .route("/api/tipos-producto")
            .get(access_1.authenticate, access_1.authorize, this.productTypesController.getAll.bind(this.productTypesController));
        // getOne
        app
            .route("/api/tipos-producto/:id")
            .get(access_1.authenticate, access_1.authorize, this.productTypesController.getOne.bind(this.productTypesController));
        // create
        app
            .route("/api/tipos-producto")
            .post(access_1.authenticate, access_1.authorize, this.productTypesController.create.bind(this.productTypesController));
        // update (PUT / PATCH)
        app
            .route("/api/tipos-producto/:id")
            .put(access_1.authenticate, access_1.authorize, this.productTypesController.updatePut.bind(this.productTypesController))
            .patch(access_1.authenticate, access_1.authorize, this.productTypesController.updatePatch.bind(this.productTypesController));
        // delete físico
        app
            .route("/api/tipos-producto/:id")
            .delete(access_1.authenticate, access_1.authorize, this.productTypesController.deletePhysical.bind(this.productTypesController));
        // delete lógico
        app
            .route("/api/tipos-producto/:id/deactivate")
            .patch(access_1.authenticate, access_1.authorize, this.productTypesController.deleteLogical.bind(this.productTypesController));
    }
}
exports.ProductTypesRoutes = ProductTypesRoutes;
//# sourceMappingURL=product-types.routes.js.map