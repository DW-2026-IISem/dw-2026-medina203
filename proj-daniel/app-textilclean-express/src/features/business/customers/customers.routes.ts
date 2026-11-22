import { Application } from "express";
import { CustomersController } from "./customers.controller";

/** Rutas de Customers — Fase I: SIN AUTH. */
export class CustomersRoutes {
  public controller: CustomersController = new CustomersController();

  public routes(app: Application): void {
    const c = this.controller;

    app.route("/api/clientes")
      .get(c.getAll.bind(c))
      .post(c.create.bind(c));

    app.route("/api/clientes/:id")
      .get(c.getOne.bind(c))
      .put(c.updatePut.bind(c))
      .patch(c.updatePatch.bind(c))
      .delete(c.deletePhysical.bind(c));

    app.route("/api/clientes/:id/deactivate")
      .patch(c.deleteLogical.bind(c));
  }
}
