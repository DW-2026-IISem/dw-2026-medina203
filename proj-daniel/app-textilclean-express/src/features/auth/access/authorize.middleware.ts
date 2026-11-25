import { NextFunction, Request, Response } from "express";
import { isOperationGranted, normalizePath } from "../../../shared/auth/resource-match";
import { AppError } from "../../../shared/errors/app-error";
import { sendError } from "../../../shared/http/error-response";
// Declara el tipo global `req.auth` (augmentación de Express.Request).
import "../../../shared/auth/auth-user";
import { ResourceRolesRepository } from "../resource-roles/resource-roles.repository";
import { isAuthEnabled } from "./auth-switch";

const resourceRolesRepository = new ResourceRolesRepository();

/**
 * Modalidad **JWT + RBAC**: después de `authenticate`, verifica que algún rol
 * activo del usuario tenga concedida la operación `METHOD /ruta` pedida.
 *
 * - **Deny by default**: sin concesión activa → 403.
 * - Consulta la matriz en cada petición (sin caché): conceder o retirar un
 *   permiso tiene efecto inmediato.
 */
export async function authorize(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isAuthEnabled()) return next();
  try {
    if (!req.auth) throw new AppError(401, "Authentication required");
    const method = req.method.toUpperCase();
    const path = normalizePath(req.originalUrl);
    const granted = await resourceRolesRepository.findEffectiveForUser(req.auth.id);
    if (!isOperationGranted(granted, method, path)) {
      throw new AppError(403, `Forbidden: no grant for ${method} ${path}`);
    }
    next();
  } catch (error) {
    sendError(res, error);
  }
}
