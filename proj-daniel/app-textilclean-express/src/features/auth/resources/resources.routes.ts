import { Application } from "express";
import { ResourcesController } from "./resources.controller";

// TODO ISS-13: añadir authenticate y authorize a todas las operaciones.
export class ResourcesRoutes {
  public resourcesController: ResourcesController = new ResourcesController();
  public routes(app: Application): void {
    app.route("/api/recursos").get(this.resourcesController.getAll.bind(this.resourcesController)).post(this.resourcesController.create.bind(this.resourcesController));
    app.route("/api/recursos/:id").get(this.resourcesController.getOne.bind(this.resourcesController)).put(this.resourcesController.updatePut.bind(this.resourcesController)).patch(this.resourcesController.updatePatch.bind(this.resourcesController)).delete(this.resourcesController.deletePhysical.bind(this.resourcesController));
    app.route("/api/recursos/:id/deactivate").patch(this.resourcesController.deleteLogical.bind(this.resourcesController));
  }
}