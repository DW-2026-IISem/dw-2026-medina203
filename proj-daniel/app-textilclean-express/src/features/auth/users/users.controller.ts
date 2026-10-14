import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { ChangePasswordDto, CreateUserDto, PatchUserDto, UpdateUserDto } from "./dto";
import { UsersService } from "./users.service";

export class UsersController extends BaseController {
  public constructor(private readonly service: UsersService = new UsersService()) {
    super();
  }

  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ users: await this.service.getAll() });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ user: await this.service.getOne(this.paramId(req)) });
    });
  }

  public async getEffectivePermissions(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const permissions = await this.service.getEffectivePermissions(this.paramId(req));
      res.status(200).json({ permissions });
    });
  }

  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(201).json({ user: await this.service.create(req.body as CreateUserDto) });
    });
  }

  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({
        user: await this.service.updatePut(this.paramId(req), req.body as UpdateUserDto),
      });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({
        user: await this.service.updatePatch(this.paramId(req), req.body as PatchUserDto),
      });
    });
  }

  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "User permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "User deactivated (logical delete)", user });
    });
  }

  public async changePassword(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.changePassword(id, req.body as ChangePasswordDto);
      res.status(200).json({ message: "Password updated", id });
    });
  }
}