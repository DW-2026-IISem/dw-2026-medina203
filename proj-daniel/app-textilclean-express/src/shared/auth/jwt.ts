import jwt, { JwtPayload } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { AppError } from "../errors/app-error";

const ALGORITHM = "HS256";

export const TOKEN_ISSUER = "app-textilclean-express";
export const TOKEN_AUDIENCE = "app-textilclean-api";
export const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.JWT_ACCESS_TTL ?? 900);

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  username: string;
  jti: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new AppError(500, "JWT_SECRET no configurado (mínimo 32 caracteres). Ver .env");
  }
  return secret;
}

export function signAccessToken(user: { id: number; username: string }): {
  token: string;
  expiresIn: number;
} {
  const token = jwt.sign(
    { username: user.username },
    getSecret(),
    {
      algorithm: ALGORITHM,
      subject: String(user.id),
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      jwtid: randomUUID(),
    }
  );
  return { token, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, getSecret(), {
      algorithms: [ALGORITHM],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      clockTolerance: 5,
    }) as JwtPayload;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, "Invalid or expired access token");
  }

  if (
    typeof payload.sub !== "string" ||
    !/^[1-9]\d*$/.test(payload.sub) ||
    typeof payload.username !== "string" ||
    typeof payload.jti !== "string" ||
    payload.jti.length === 0
  ) {
    throw new AppError(401, "Invalid or expired access token");
  }
  return payload as AccessTokenPayload;
}

export function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value, extra] = header.trim().split(/\s+/);
  if (!scheme || !value || extra || scheme.toLowerCase() !== "bearer") return null;
  return value;
}