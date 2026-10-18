import { Request, Response } from "express";
import { requireAuthUser } from "../../../shared/auth/auth-user";
import { BaseController } from "../../../shared/http/base-controller";
import { LoginDto, LogoutSessionDto, RefreshSessionDto } from "./dto";
import { SessionService } from "./session.service";

export class SessionController extends BaseController {
  public constructor(private readonly service: SessionService = new SessionService()) { super(); }

  public async login(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json(await this.service.login(req.body as LoginDto, deviceInfo(req)));
    });
  }
  public async refresh(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json(await this.service.refresh(req.body as RefreshSessionDto, deviceInfo(req)));
    });
  }
  public async logout(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      await this.service.logout(req.body as LogoutSessionDto);
      res.status(200).json({ message: "Session closed" });
    });
  }
  public async profile(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ user: await this.service.profile(requireAuthUser(req).id) });
    });
  }
  public async myPermissions(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ permissions: await this.service.myPermissions(requireAuthUser(req).id) });
    });
  }
}

function deviceInfo(req: Request): string | null {
  const userAgent = req.headers["user-agent"];
  return userAgent ? String(userAgent).slice(0, 500) : null;
}