import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CreateRoleUserDto } from "./dto";
import { RoleUsersService } from "./role-users.service";

export class RoleUsersController extends BaseController {
  public constructor(private readonly service: RoleUsersService = new RoleUsersService()) { super(); }
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ assignments: await this.service.getAll() }); });
  }
  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(200).json({ assignment: await this.service.getOne(this.paramId(req)) }); });
  }
  public async assign(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { res.status(201).json({ assignment: await this.service.assign(req.body as CreateRoleUserDto) }); });
  }
  public async deactivate(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { const assignment = await this.service.deactivate(this.paramId(req)); res.status(200).json({ message: "Role assignment deactivated", assignment }); });
  }
  public async reactivate(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => { const assignment = await this.service.reactivate(this.paramId(req)); res.status(200).json({ message: "Role assignment reactivated", assignment }); });
  }
}