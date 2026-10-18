"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSalesRoutes = void 0;
const product_sales_controller_1 = require("./product-sales.controller");
const access_1 = require("../../auth/access");
class ProductSalesRoutes {
    constructor() {
        this.productSalesController = new product_sales_controller_1.ProductSalesController();
    }
    routes(app) {
        app
            .route("/api/detalle-ventas")
            .get(access_1.authenticate, access_1.authorize, this.productSalesController.getAll.bind(this.productSalesController));
        app
            .route("/api/detalle-ventas/:id")
            .get(access_1.authenticate, access_1.authorize, this.productSalesController.getOne.bind(this.productSalesController));
        app
            .route("/api/detalle-ventas")
            .post(access_1.authenticate, access_1.authorize, this.productSalesController.create.bind(this.productSalesController));
        app
            .route("/api/detalle-ventas/:id")
            .put(access_1.authenticate, access_1.authorize, this.productSalesController.updatePut.bind(this.productSalesController))
            .patch(access_1.authenticate, access_1.authorize, this.productSalesController.updatePatch.bind(this.productSalesController));
        app
            .route("/api/detalle-ventas/:id")
            .delete(access_1.authenticate, access_1.authorize, this.productSalesController.deletePhysical.bind(this.productSalesController));
        app
            .route("/api/detalle-ventas/:id/deactivate")
            .patch(access_1.authenticate, access_1.authorize, this.productSalesController.deleteLogical.bind(this.productSalesController));
    }
}
exports.ProductSalesRoutes = ProductSalesRoutes;
//# sourceMappingURL=product-sales.routes.js.map