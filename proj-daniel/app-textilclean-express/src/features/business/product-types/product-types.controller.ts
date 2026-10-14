import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import {
  CreateProductTypeDto,
  PatchProductTypeDto,
  UpdateProductTypeDto,
} from "./dto";
import { ProductTypesService } from "./product-types.service";

/**
 * Capa Controller del feature ProductTypes.
 * Solo HTTP: lee `req`, llama al service y arma la respuesta.
 * El manejo de errores se delega en `run()` (ver `BaseController`).
 */
export class ProductTypesController extends BaseController {
  public constructor(
    private readonly service: ProductTypesService = new ProductTypesService()
  ) {
    super();
  }

  // ================== READ ==================
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_types = await this.service.getAll();
      res.status(200).json({ product_types });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_type = await this.service.getOne(this.paramId(req));
      res.status(200).json({ product_type });
    });
  }

  // ================== CREATE ==================
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_type = await this.service.create(
        req.body as CreateProductTypeDto
      );
      res.status(201).json({ product_type });
    });
  }

  // ================== UPDATE ==================
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_type = await this.service.updatePut(
        this.paramId(req),
        req.body as UpdateProductTypeDto
      );
      res.status(200).json({ product_type });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_type = await this.service.updatePatch(
        this.paramId(req),
        req.body as PatchProductTypeDto
      );
      res.status(200).json({ product_type });
    });
  }

  // ================== DELETE ==================
  /** Eliminación física. */
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Product type permanently deleted", id });
    });
  }

  /** Eliminación lógica -> `status = inactive`. */
  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_type = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({
        message: "Product type deactivated (logical delete)",
        product_type,
      });
    });
  }
}
