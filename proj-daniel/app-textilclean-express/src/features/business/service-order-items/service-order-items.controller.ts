import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { ServiceOrderItemsService } from "./service-order-items.service";
import {
  CreateServiceOrderItemDto,
  PatchServiceOrderItemDto,
  UpdateServiceOrderItemDto,
} from "./dto";

/** Controller de ServiceOrderItems: solo HTTP. */
export class ServiceOrderItemsController extends BaseController {
  public constructor(private readonly service: ServiceOrderItemsService = new ServiceOrderItemsService()) {
    super();
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ service_order_items: await this.service.getAll(req.query as Record<string, unknown>) });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ service_order_item: await this.service.getOne(this.paramId(req)) });
    });
  }

  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const serviceOrderItem = await this.service.create(req.body as CreateServiceOrderItemDto);
      res.status(201).json({ service_order_item: serviceOrderItem });
    });
  }

  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const serviceOrderItem = await this.service.updatePut(this.paramId(req), req.body as UpdateServiceOrderItemDto);
      res.status(200).json({ service_order_item: serviceOrderItem });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const serviceOrderItem = await this.service.updatePatch(this.paramId(req), req.body as PatchServiceOrderItemDto);
      res.status(200).json({ service_order_item: serviceOrderItem });
    });
  }


  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Service order item permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const serviceOrderItem = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "Service order item deactivated (logical delete)", service_order_item: serviceOrderItem });
    });
  }
}
