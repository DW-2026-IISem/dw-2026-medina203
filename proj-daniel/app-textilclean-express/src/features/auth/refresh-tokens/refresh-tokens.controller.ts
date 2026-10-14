import { Request, Response } from "express";
import { requireAuthUser } from "../../../shared/auth/auth-user";
import { BaseController } from "../../../shared/http/base-controller";
import { RefreshTokensService } from "./refresh-tokens.service";

export class RefreshTokensController extends BaseController {
  public constructor(private readonly service: RefreshTokensService = new RefreshTokensService()) { super(); }

  public async getAll(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ sessions: await this.service.getAllMine(requireAuthUser(req).id) });
    });
  }
  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ session: await this.service.getMine(requireAuthUser(req).id, this.paramId(req)) });
    });
  }
  public async revokeAll(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const revoked = await this.service.revokeAllMine(requireAuthUser(req).id);
      res.status(200).json({ message: "All sessions revoked", revoked });
    });
  }
  public async revokeOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const session = await this.service.revokeMine(requireAuthUser(req).id, this.paramId(req));
      res.status(200).json({ message: "Session revoked", session });
    });
  }
  public async purge(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const purged = await this.service.purgeMine(requireAuthUser(req).id);
      res.status(200).json({ message: "Inactive sessions purged", purged });
    });
  }
}