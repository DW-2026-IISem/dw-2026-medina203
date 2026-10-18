"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsRoutes = void 0;
const products_controller_1 = require("./products.controller");
const access_1 = require("../../auth/access");
class ProductsRoutes {
    constructor() {
        this.productsController = new products_controller_1.ProductsController();
    }
    routes(app) {
        app
            .route("/api/productos")
            .get(access_1.authenticate, access_1.authorize, this.productsController.getAll.bind(this.productsController));
        app
            .route("/api/productos/:id")
            .get(access_1.authenticate, access_1.authorize, this.productsController.getOne.bind(this.productsController));
        app
            .route("/api/productos")
            .post(access_1.authenticate, access_1.authorize, this.productsController.create.bind(this.productsController));
        app
            .route("/api/productos/:id")
            .put(access_1.authenticate, access_1.authorize, this.productsController.updatePut.bind(this.productsController))
            .patch(access_1.authenticate, access_1.authorize, this.productsController.updatePatch.bind(this.productsController));
        app
            .route("/api/productos/:id")
            .delete(access_1.authenticate, access_1.authorize, this.productsController.deletePhysical.bind(this.productsController));
        app
            .route("/api/productos/:id/deactivate")
            .patch(access_1.authenticate, access_1.authorize, this.productsController.deleteLogical.bind(this.productsController));
    }
}
exports.ProductsRoutes = ProductsRoutes;
//# sourceMappingURL=products.routes.js.map