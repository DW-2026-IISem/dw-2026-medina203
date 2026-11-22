import { Application } from "express";
import { protect } from "../../auth/access";
import { CustomersController } from "./customers.controller";

/** Rutas de Customers — JWT + RBAC (authenticate + authorize). */
export class CustomersRoutes {
  public controller: CustomersController = new CustomersController();

  public routes(app: Application): void {
    const c = this.controller;

    app.route("/api/clientes")
      .get(...protect, c.getAll.bind(c))
      .post(...protect, c.create.bind(c));

    app.route("/api/clientes/:id")
      .get(...protect, c.getOne.bind(c))
      .put(...protect, c.updatePut.bind(c))
      .patch(...protect, c.updatePatch.bind(c))
      .delete(...protect, c.deletePhysical.bind(c));

    app.route("/api/clientes/:id/deactivate")
      .patch(...protect, c.deleteLogical.bind(c));
  }
}
