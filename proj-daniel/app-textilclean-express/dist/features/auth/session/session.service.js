"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const password_1 = require("../../../shared/auth/password");
const jwt_1 = require("../../../shared/auth/jwt");
const app_error_1 = require("../../../shared/errors/app-error");
const resource_roles_service_1 = require("../resource-roles/resource-roles.service");
const refresh_tokens_service_1 = require("../refresh-tokens/refresh-tokens.service");
const users_repository_1 = require("../users/users.repository");
class SessionService {
    constructor(usersRepository = new users_repository_1.UsersRepository(), refreshTokensService = new refresh_tokens_service_1.RefreshTokensService(), resourceRolesService = new resource_roles_service_1.ResourceRolesService()) {
        this.usersRepository = usersRepository;
        this.refreshTokensService = refreshTokensService;
        this.resourceRolesService = resourceRolesService;
    }
    async login(body, deviceInfo) {
        if (!body || typeof body.identifier !== "string" || !body.identifier.trim() ||
            typeof body.password !== "string" || !body.password) {
            throw new app_error_1.AppError(400, "identifier and password are required");
        }
        const user = await this.usersRepository.findByIdentifierWithPassword(body.identifier);
        if (!user || user.status !== "active" || !(await (0, password_1.comparePassword)(body.password, user.password))) {
            throw new app_error_1.AppError(401, "Invalid credentials");
        }
        const session = await this.refreshTokensService.issue(user.id, deviceInfo);
        return this.buildTokens(user, session.rawToken, session.expiresAt);
    }
    async refresh(body, deviceInfo) {
        if (!body || typeof body.refresh_token !== "string" || !body.refresh_token) {
            throw new app_error_1.AppError(400, "refresh_token is required");
        }
        const outcome = await this.refreshTokensService.rotate(body.refresh_token, deviceInfo);
        if (outcome.kind === "invalid")
            throw new app_error_1.AppError(401, "Invalid refresh token");
        if (outcome.kind === "expired")
            throw new app_error_1.AppError(401, "Refresh token expired");
        if (outcome.kind === "reuse")
            throw new app_error_1.AppError(401, "Refresh token reuse detected: session family revoked");
        const user = await this.usersRepository.findById(outcome.userId);
        if (!user || user.status !== "active") {
            await this.refreshTokensService.revokeAllMine(outcome.userId);
            throw new app_error_1.AppError(401, "User is not active");
        }
        return this.buildTokens(user, outcome.rawToken, outcome.expiresAt);
    }
    async logout(body) {
        if (!body || typeof body.refresh_token !== "string" || !body.refresh_token) {
            throw new app_error_1.AppError(400, "refresh_token is required");
        }
        await this.refreshTokensService.revokeByToken(body.refresh_token);
    }
    async profile(userId) {
        const user = await this.usersRepository.findById(userId);
        if (!user || user.status !== "active")
            throw new app_error_1.AppError(404, "User not found");
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar ?? null,
            status: user.status,
        };
    }
    async myPermissions(userId) {
        return this.resourceRolesService.findEffectiveForUser(userId);
    }
    buildTokens(user, refreshToken, refreshExpiresAt) {
        const access = (0, jwt_1.signAccessToken)({ id: user.id, username: user.username });
        return {
            access_token: access.token,
            token_type: "Bearer",
            expires_in: access.expiresIn,
            refresh_token: refreshToken,
            refresh_expires_in: Math.max(0, Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000)),
        };
    }
}
exports.SessionService = SessionService;
//# sourceMappingURL=session.service.js.map