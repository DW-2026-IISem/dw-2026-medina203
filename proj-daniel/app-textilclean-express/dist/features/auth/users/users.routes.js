"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRoutes = void 0;
const users_controller_1 = require("./users.controller");
const access_1 = require("../access");
// TODO ISS-13: proteger todas las operaciones con authenticate y authorize.
class UsersRoutes {
    constructor() {
        this.usersController = new users_controller_1.UsersController();
    }
    routes(app) {
        app
            .route("/api/usuarios/:id/permisos")
            .get(access_1.authenticate, access_1.authorize, this.usersController.getEffectivePermissions.bind(this.usersController));
        app.route("/api/usuarios").get(access_1.authenticate, access_1.authorize, this.usersController.getAll.bind(this.usersController));
        app.route("/api/usuarios/:id").get(access_1.authenticate, access_1.authorize, this.usersController.getOne.bind(this.usersController));
        app.route("/api/usuarios").post(access_1.authenticate, access_1.authorize, this.usersController.create.bind(this.usersController));
        app
            .route("/api/usuarios/:id")
            .put(access_1.authenticate, access_1.authorize, this.usersController.updatePut.bind(this.usersController))
            .patch(access_1.authenticate, access_1.authorize, this.usersController.updatePatch.bind(this.usersController));
        app.route("/api/usuarios/:id").delete(access_1.authenticate, access_1.authorize, this.usersController.deletePhysical.bind(this.usersController));
        app
            .route("/api/usuarios/:id/deactivate")
            .patch(access_1.authenticate, access_1.authorize, this.usersController.deleteLogical.bind(this.usersController));
        app
            .route("/api/usuarios/:id/password")
            .patch(access_1.authenticate, access_1.authorize, this.usersController.changePassword.bind(this.usersController));
    }
}
exports.UsersRoutes = UsersRoutes;
//# sourceMappingURL=users.routes.js.map