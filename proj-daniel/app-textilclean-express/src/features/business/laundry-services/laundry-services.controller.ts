import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { LaundryServicesService } from "./laundry-services.service";
import { CreateLaundryServiceDto, PatchLaundryServiceDto, UpdateLaundryServiceDto } from "./dto";

/** Controller de LaundryServices: solo HTTP (lee req, llama al service, arma res). */
export class LaundryServicesController extends BaseController {
  public constructor(private readonly service: LaundryServicesService = new LaundryServicesService()) {
    super();
  }

  // ================== READ ==================
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ laundry_services: await this.service.getAll() });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ laundry_service: await this.service.getOne(this.paramId(req)) });
    });
  }

  // ================== CREATE ==================
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const laundryService = await this.service.create(req.body as CreateLaundryServiceDto);
      res.status(201).json({ laundry_service: laundryService });
    });
  }

  // ================== UPDATE ==================
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const laundryService = await this.service.updatePut(this.paramId(req), req.body as UpdateLaundryServiceDto);
      res.status(200).json({ laundry_service: laundryService });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const laundryService = await this.service.updatePatch(this.paramId(req), req.body as PatchLaundryServiceDto);
      res.status(200).json({ laundry_service: laundryService });
    });
  }

  // ================== DELETE ==================
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Laundry service permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const laundryService = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "Laundry service deactivated (logical delete)", laundry_service: laundryService });
    });
  }
}
