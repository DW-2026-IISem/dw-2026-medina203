import { RefreshToken, RefreshTokenI } from "../refresh-token.model";

export type RefreshTokenResponseDto = Omit<RefreshTokenI, "token_hash"> & {
  is_expired: boolean;
};

export function toRefreshTokenResponse(token: RefreshToken): RefreshTokenResponseDto {
  const { token_hash: _tokenHash, ...safe } = token.toJSON() as RefreshTokenI & { token_hash?: string };
  return { ...safe, is_expired: new Date(token.expires_at).getTime() <= Date.now() };
}