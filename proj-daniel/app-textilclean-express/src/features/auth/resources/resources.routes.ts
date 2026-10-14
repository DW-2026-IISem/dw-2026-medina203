import { Application } from "express";
import { ResourcesController } from "./resources.controller";
import { authenticate, authorize } from "../access";

// TODO ISS-13: añadir authenticate y authorize a todas las operaciones.
export class ResourcesRoutes {
  public resourcesController: ResourcesController = new ResourcesController();
  public routes(app: Application): void {
    app.route("/api/recursos").get(authenticate, authorize, this.resourcesController.getAll.bind(this.resourcesController)).post(authenticate, authorize, this.resourcesController.create.bind(this.resourcesController));
    app.route("/api/recursos/:id").get(authenticate, authorize, this.resourcesController.getOne.bind(this.resourcesController)).put(authenticate, authorize, this.resourcesController.updatePut.bind(this.resourcesController)).patch(authenticate, authorize, this.resourcesController.updatePatch.bind(this.resourcesController)).delete(authenticate, authorize, this.resourcesController.deletePhysical.bind(this.resourcesController));
    app.route("/api/recursos/:id/deactivate").patch(authenticate, authorize, this.resourcesController.deleteLogical.bind(this.resourcesController));
  }
}