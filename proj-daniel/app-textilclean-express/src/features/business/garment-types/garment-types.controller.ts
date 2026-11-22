import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { GarmentTypesService } from "./garment-types.service";
import { CreateGarmentTypeDto, PatchGarmentTypeDto, UpdateGarmentTypeDto } from "./dto";

/** Controller de GarmentTypes: solo HTTP (lee req, llama al service, arma res). */
export class GarmentTypesController extends BaseController {
  public constructor(private readonly service: GarmentTypesService = new GarmentTypesService()) {
    super();
  }

  // ================== READ ==================
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ garment_types: await this.service.getAll() });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ garment_type: await this.service.getOne(this.paramId(req)) });
    });
  }

  // ================== CREATE ==================
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const garmentType = await this.service.create(req.body as CreateGarmentTypeDto);
      res.status(201).json({ garment_type: garmentType });
    });
  }

  // ================== UPDATE ==================
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const garmentType = await this.service.updatePut(this.paramId(req), req.body as UpdateGarmentTypeDto);
      res.status(200).json({ garment_type: garmentType });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const garmentType = await this.service.updatePatch(this.paramId(req), req.body as PatchGarmentTypeDto);
      res.status(200).json({ garment_type: garmentType });
    });
  }

  // ================== DELETE ==================
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Garment type permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const garmentType = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "Garment type deactivated (logical delete)", garment_type: garmentType });
    });
  }
}
