import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CreateRoleDto, PatchRoleDto, UpdateRoleDto } from "./dto";
import { RolesService } from "./roles.service";

export class RolesController extends BaseController {
  public constructor(private readonly service: RolesService = new RolesService()) { super(); }

  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ roles: await this.service.getAll() }); });
  }
  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ role: await this.service.getOne(this.paramId(req)) }); });
  }
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(201).json({ role: await this.service.create(req.body as CreateRoleDto) }); });
  }
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ role: await this.service.updatePut(this.paramId(req), req.body as UpdateRoleDto) }); });
  }
  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ role: await this.service.updatePatch(this.paramId(req), req.body as PatchRoleDto) }); });
  }
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { const id = this.paramId(req); await this.service.deletePhysical(id); res.status(200).json({ message: "Role permanently deleted", id }); });
  }
  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { const role = await this.service.deleteLogical(this.paramId(req)); res.status(200).json({ message: "Role deactivated", role }); });
  }
}