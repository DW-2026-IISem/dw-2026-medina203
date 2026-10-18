"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toRefreshTokenResponse = toRefreshTokenResponse;
function toRefreshTokenResponse(token) {
    const { token_hash: _tokenHash, ...safe } = token.toJSON();
    return { ...safe, is_expired: new Date(token.expires_at).getTime() <= Date.now() };
}
//# sourceMappingURL=refresh-token-response.dto.js.map