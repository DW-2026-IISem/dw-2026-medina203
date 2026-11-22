import { NextFunction, Request, Response } from "express";
import { extractBearerToken, verifyAccessToken } from "../../../shared/auth/jwt";
import { AppError } from "../../../shared/errors/app-error";
import { sendError } from "../../../shared/http/error-response";
// Declara el tipo global `req.auth` (augmentación de Express.Request).
import "../../../shared/auth/auth-user";
import { UsersRepository } from "../users/users.repository";
import { isAuthEnabled } from "./auth-switch";

const usersRepository = new UsersRepository();

/**
 * Modalidad **JWT**: exige `Authorization: Bearer <access_token>` válido
 * (firma, iss, aud, exp) y que el usuario siga activo. Deja la identidad en `req.auth`.
 * 401 si falta, es inválido, expiró o el usuario fue desactivado.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isAuthEnabled()) return next();
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) throw new AppError(401, "Missing Bearer token");

    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);
    const user = await usersRepository.findById(userId);
    if (!user || user.status !== "active") throw new AppError(401, "User is not active");

    req.auth = { id: user.id, username: user.username, email: user.email, tokenId: payload.jti };
    next();
  } catch (error) {
    sendError(res, error);
  }
}
