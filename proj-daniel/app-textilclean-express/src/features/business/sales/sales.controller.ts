import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CreateSaleDto, PatchSaleDto, UpdateSaleDto } from "./dto";
import { SalesService } from "./sales.service";

export class SalesController extends BaseController {
  public constructor(private readonly service: SalesService = new SalesService()) {
    super();
  }

  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ sales: await this.service.getAll() });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ sale: await this.service.getOne(this.paramId(req)) });
    });
  }

  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const sale = await this.service.create(req.body as CreateSaleDto);
      res.status(201).json({ sale });
    });
  }

  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const sale = await this.service.updatePut(this.paramId(req), req.body as UpdateSaleDto);
      res.status(200).json({ sale });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const sale = await this.service.updatePatch(this.paramId(req), req.body as PatchSaleDto);
      res.status(200).json({ sale });
    });
  }

  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Sale permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const sale = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "Sale deactivated", sale });
    });
  }
}