import { randomUUID } from "node:crypto";
import { Transaction } from "sequelize";
import { generateOpaqueToken, sha256Hex } from "../../../shared/auth/password";
import { withTransaction } from "../../../shared/database/with-transaction";
import { AppError } from "../../../shared/errors/app-error";
import { RefreshTokenResponseDto, toRefreshTokenResponse } from "./dto";
import { RefreshToken } from "./refresh-token.model";
import { RefreshTokensRepository } from "./refresh-tokens.repository";

const REFRESH_TTL_DAYS = Number(process.env.JWT_REFRESH_TTL_DAYS ?? 30);

export interface IssuedSession { rawToken: string; familyId: string; expiresAt: Date }
export type RotationOutcome =
  | { kind: "rotated"; userId: number; rawToken: string; familyId: string; expiresAt: Date }
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "reuse"; familyId: string; revoked: number };

export class RefreshTokensService {
  public constructor(private readonly repository: RefreshTokensRepository = new RefreshTokensRepository()) {}

  public async getAllMine(userId: number): Promise<RefreshTokenResponseDto[]> {
    return (await this.repository.findAllByUser(userId)).map(toRefreshTokenResponse);
  }
  public async getMine(userId: number, id: number): Promise<RefreshTokenResponseDto> {
    return toRefreshTokenResponse(await this.findMineOrFail(userId, id));
  }
  public async revokeMine(userId: number, id: number): Promise<RefreshTokenResponseDto> {
    const token = await this.findMineOrFail(userId, id);
    if (token.status === "active") await this.repository.update(token, { status: "inactive" });
    return toRefreshTokenResponse(token);
  }
  public revokeAllMine(userId: number): Promise<number> { return this.repository.revokeAllByUser(userId); }
  public purgeMine(userId: number): Promise<number> { return this.repository.purgeInactiveByUser(userId); }
  public countActiveMine(userId: number): Promise<number> { return this.repository.countActiveByUser(userId); }

  public async issue(userId: number, deviceInfo: string | null, transaction?: Transaction): Promise<IssuedSession> {
    const rawToken = generateOpaqueToken();
    const familyId = randomUUID();
    const expiresAt = expiryFromNow();
    await this.repository.create({
      user_id: userId, token_hash: sha256Hex(rawToken), family_id: familyId,
      device_info: deviceInfo, expires_at: expiresAt, status: "active",
    }, transaction);
    return { rawToken, familyId, expiresAt };
  }

  public async rotate(rawToken: string, deviceInfo: string | null): Promise<RotationOutcome> {
    if (!rawToken) return { kind: "invalid" };
    return withTransaction<RotationOutcome>(async (transaction) => {
      const current = await this.repository.findByHash(sha256Hex(rawToken), transaction, true);
      if (!current) return { kind: "invalid" };
      if (current.status !== "active") {
        const revoked = await this.repository.revokeFamily(current.family_id, transaction);
        return { kind: "reuse", familyId: current.family_id, revoked };
      }
      if (new Date(current.expires_at).getTime() <= Date.now()) {
        await this.repository.update(current, { status: "inactive" }, transaction);
        return { kind: "expired" };
      }

      await this.repository.update(current, { status: "inactive" }, transaction);
      const nextToken = generateOpaqueToken();
      const expiresAt = expiryFromNow();
      await this.repository.create({
        user_id: current.user_id,
        token_hash: sha256Hex(nextToken),
        family_id: current.family_id,
        device_info: deviceInfo ?? current.device_info,
        expires_at: expiresAt,
        status: "active",
      }, transaction);
      return { kind: "rotated", userId: current.user_id, rawToken: nextToken, familyId: current.family_id, expiresAt };
    });
  }

  public async revokeByToken(rawToken: string): Promise<boolean> {
    if (!rawToken) return false;
    const token = await this.repository.findByHash(sha256Hex(rawToken));
    if (!token) return false;
    if (token.status === "active") await this.repository.update(token, { status: "inactive" });
    return true;
  }

  private async findMineOrFail(userId: number, id: number): Promise<RefreshToken> {
    const token = await this.repository.findById(id);
    if (!token || token.user_id !== userId) throw new AppError(404, "Session not found");
    return token;
  }
}

function expiryFromNow(): Date {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}