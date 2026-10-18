import { comparePassword } from "../../../shared/auth/password";
import { signAccessToken } from "../../../shared/auth/jwt";
import { AppError } from "../../../shared/errors/app-error";
import { EffectivePermissionDto } from "../resource-roles/dto";
import { ResourceRolesService } from "../resource-roles/resource-roles.service";
import { RefreshTokensService } from "../refresh-tokens/refresh-tokens.service";
import { UsersRepository } from "../users/users.repository";
import { LoginDto, LogoutSessionDto, ProfileDto, RefreshSessionDto, SessionTokensDto } from "./dto";
import { User } from "../users/user.model";

export class SessionService {
  public constructor(
    private readonly usersRepository: UsersRepository = new UsersRepository(),
    private readonly refreshTokensService: RefreshTokensService = new RefreshTokensService(),
    private readonly resourceRolesService: ResourceRolesService = new ResourceRolesService()
  ) {}

  public async login(body: LoginDto, deviceInfo: string | null): Promise<SessionTokensDto> {
    if (!body || typeof body.identifier !== "string" || !body.identifier.trim() ||
        typeof body.password !== "string" || !body.password) {
      throw new AppError(400, "identifier and password are required");
    }
    const user = await this.usersRepository.findByIdentifierWithPassword(body.identifier);
    if (!user || user.status !== "active" || !(await comparePassword(body.password, user.password))) {
      throw new AppError(401, "Invalid credentials");
    }
    const session = await this.refreshTokensService.issue(user.id, deviceInfo);
    return this.buildTokens(user, session.rawToken, session.expiresAt);
  }

  public async refresh(body: RefreshSessionDto, deviceInfo: string | null): Promise<SessionTokensDto> {
    if (!body || typeof body.refresh_token !== "string" || !body.refresh_token) {
      throw new AppError(400, "refresh_token is required");
    }
    const outcome = await this.refreshTokensService.rotate(body.refresh_token, deviceInfo);
    if (outcome.kind === "invalid") throw new AppError(401, "Invalid refresh token");
    if (outcome.kind === "expired") throw new AppError(401, "Refresh token expired");
    if (outcome.kind === "reuse") throw new AppError(401, "Refresh token reuse detected: session family revoked");

    const user = await this.usersRepository.findById(outcome.userId);
    if (!user || user.status !== "active") {
      await this.refreshTokensService.revokeAllMine(outcome.userId);
      throw new AppError(401, "User is not active");
    }
    return this.buildTokens(user, outcome.rawToken, outcome.expiresAt);
  }

  public async logout(body: LogoutSessionDto): Promise<void> {
    if (!body || typeof body.refresh_token !== "string" || !body.refresh_token) {
      throw new AppError(400, "refresh_token is required");
    }
    await this.refreshTokensService.revokeByToken(body.refresh_token);
  }

  public async profile(userId: number): Promise<ProfileDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user || user.status !== "active") throw new AppError(404, "User not found");
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar ?? null,
      status: user.status,
    };
  }

  public async myPermissions(userId: number): Promise<EffectivePermissionDto[]> {
    return this.resourceRolesService.findEffectiveForUser(userId);
  }

  private buildTokens(user: User, refreshToken: string, refreshExpiresAt: Date): SessionTokensDto {
    const access = signAccessToken({ id: user.id, username: user.username });
    return {
      access_token: access.token,
      token_type: "Bearer",
      expires_in: access.expiresIn,
      refresh_token: refreshToken,
      refresh_expires_in: Math.max(0, Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000)),
    };
  }
}