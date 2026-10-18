"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokensRoutes = void 0;
const access_1 = require("../access");
const refresh_tokens_controller_1 = require("./refresh-tokens.controller");
class RefreshTokensRoutes {
    constructor() {
        this.refreshTokensController = new refresh_tokens_controller_1.RefreshTokensController();
    }
    routes(app) {
        app.route("/api/sesiones")
            .get(access_1.authenticate, this.refreshTokensController.getAll.bind(this.refreshTokensController))
            .delete(access_1.authenticate, this.refreshTokensController.purge.bind(this.refreshTokensController));
        app.route("/api/sesiones/deactivate-all")
            .patch(access_1.authenticate, this.refreshTokensController.revokeAll.bind(this.refreshTokensController));
        app.route("/api/sesiones/:id")
            .get(access_1.authenticate, this.refreshTokensController.getOne.bind(this.refreshTokensController));
        app.route("/api/sesiones/:id/deactivate")
            .patch(access_1.authenticate, this.refreshTokensController.revokeOne.bind(this.refreshTokensController));
    }
}
exports.RefreshTokensRoutes = RefreshTokensRoutes;
//# sourceMappingURL=refresh-tokens.routes.js.map