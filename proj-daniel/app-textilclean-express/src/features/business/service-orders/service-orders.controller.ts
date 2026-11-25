import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { ServiceOrdersService } from "./service-orders.service";
import {
  ChangeProcessStatusDto,
  CreateServiceOrderDto,
  PatchServiceOrderDto,
  UpdateServiceOrderDto,
} from "./dto";

/** Controller de ServiceOrders: solo HTTP. */
export class ServiceOrdersController extends BaseController {
  public constructor(private readonly service: ServiceOrdersService = new ServiceOrdersService()) {
    super();
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ service_orders: await this.service.getAll(req.query as Record<string, unknown>) });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ service_order: await this.service.getOne(this.paramId(req)) });
    });
  }

  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const serviceOrder = await this.service.create(req.body as CreateServiceOrderDto);
      res.status(201).json({ service_order: serviceOrder });
    });
  }

  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const serviceOrder = await this.service.updatePut(this.paramId(req), req.body as UpdateServiceOrderDto);
      res.status(200).json({ service_order: serviceOrder });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const serviceOrder = await this.service.updatePatch(this.paramId(req), req.body as PatchServiceOrderDto);
      res.status(200).json({ service_order: serviceOrder });
    });
  }

  public async changeProcessStatus(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const serviceOrder = await this.service.changeProcessStatus(
        this.paramId(req),
        req.body as ChangeProcessStatusDto
      );
      res.status(200).json({ service_order: serviceOrder });
    });
  }

  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Service order permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const serviceOrder = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "Service order cancelled (logical delete)", service_order: serviceOrder });
    });
  }
}
