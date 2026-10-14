import { Application } from "express";
import { ClientsController } from "./clients.controller";
import { authenticate, authorize } from "../../auth/access";

export class ClientsRoutes {
  public clientsController: ClientsController = new ClientsController();

  public routes(app: Application): void {
    // ================== RUTAS SIN AUTENTICACIÓN / SIN MIDDLEWARE JWT ==================
      // getAll
    app
      .route("/api/clientes")
      .get(authenticate, authorize, this.clientsController.getAll.bind(this.clientsController));

    // getOne
    app
      .route("/api/clientes/:id")
      .get(authenticate, authorize, this.clientsController.getOne.bind(this.clientsController));

      // create
    app
      .route("/api/clientes")
      .post(authenticate, authorize, this.clientsController.create.bind(this.clientsController));
      
      // update (PUT / PATCH)
    app
      .route("/api/clientes/:id")
      .put(authenticate, authorize, this.clientsController.updatePut.bind(this.clientsController))
      .patch(authenticate, authorize, this.clientsController.updatePatch.bind(this.clientsController));

     // delete físico
    app
      .route("/api/clientes/:id")
      .delete(authenticate, authorize, this.clientsController.deletePhysical.bind(this.clientsController));

    // delete lógico
    app
      .route("/api/clientes/:id/deactivate")
      .patch(authenticate, authorize, this.clientsController.deleteLogical.bind(this.clientsController));
  }
}
