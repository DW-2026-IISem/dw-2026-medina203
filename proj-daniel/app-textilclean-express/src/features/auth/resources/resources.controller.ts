import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CreateResourceDto, PatchResourceDto, UpdateResourceDto } from "./dto";
import { ResourcesService } from "./resources.service";

export class ResourcesController extends BaseController {
  public constructor(private readonly service: ResourcesService = new ResourcesService()) { super(); }
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ resources: await this.service.getAll() }); });
  }
  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ resource: await this.service.getOne(this.paramId(req)) }); });
  }
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(201).json({ resource: await this.service.create(req.body as CreateResourceDto) }); });
  }
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ resource: await this.service.updatePut(this.paramId(req), req.body as UpdateResourceDto) }); });
  }
  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ resource: await this.service.updatePatch(this.paramId(req), req.body as PatchResourceDto) }); });
  }
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { const id = this.paramId(req); await this.service.deletePhysical(id); res.status(200).json({ message: "Resource permanently deleted", id }); });
  }
  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { const resource = await this.service.deleteLogical(this.paramId(req)); res.status(200).json({ message: "Resource deactivated", resource }); });
  }
}