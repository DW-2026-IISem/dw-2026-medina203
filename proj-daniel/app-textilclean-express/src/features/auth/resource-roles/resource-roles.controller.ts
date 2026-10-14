import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CreateResourceRoleDto } from "./dto";
import { ResourceRolesService } from "./resource-roles.service";

export class ResourceRolesController extends BaseController {
  public constructor(private readonly service: ResourceRolesService = new ResourceRolesService()) { super(); }
  public async getAll(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const grants = await this.service.getAll({
        role_id: parseOptionalId(req.query.role_id),
        resource_id: parseOptionalId(req.query.resource_id),
      });
      res.status(200).json({ grants });
    });
  }
  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ grant: await this.service.getOne(this.paramId(req)) }); });
  }
  public async grant(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(201).json({ grant: await this.service.grant(req.body as CreateResourceRoleDto) }); });
  }
  public async deactivate(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ grant: await this.service.deactivate(this.paramId(req)) }); });
  }
  public async reactivate(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ grant: await this.service.reactivate(this.paramId(req)) }); });
  }
}

function parseOptionalId(value: unknown): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) return undefined;
  return Number(raw);
}