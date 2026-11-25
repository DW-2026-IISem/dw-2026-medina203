import { AppError } from "../../../../shared/errors/app-error";

/**
 * Cuerpo de `POST /api/concesiones-rol` en modo matriz: el ESTADO FINAL deseado
 * de los permisos de un rol (no una operación por casilla).
 *
 *   { "role_id": 2, "resource_ids": [1, 2, 3] }
 *
 * `resource_ids: []` es deliberado: deja al rol sin permisos.
 */
export interface ReconcileResourceRolesDto {
  role_id: number;
  resource_ids: number[];
}

/** Resultado de la reconciliación (lo que se devuelve en `result`). */
export interface ReconcileResult {
  role_id: number;
  activated: number;
  deactivated: number;
  total_active: number;
}

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1;

/** ¿El cuerpo pide guardar la matriz (trae `resource_ids`)? */
export function isReconcileBody(body: unknown): boolean {
  return typeof body === "object" && body !== null && !Array.isArray(body) && "resource_ids" in body;
}

/**
 * Valida la FORMA HTTP del cuerpo de la matriz (capa controller).
 * Las reglas que necesitan la BD (rol activo, recursos activos) son del service.
 */
export function parseReconcileBody(body: unknown): ReconcileResourceRolesDto {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new AppError(400, "Body must be a JSON object");
  }
  const raw = body as Record<string, unknown>;
  if ("resource_id" in raw) {
    throw new AppError(400, "Send either resource_id (single grant) or resource_ids (matrix), not both");
  }
  if (!isPositiveInteger(raw.role_id)) throw new AppError(400, "role_id must be a positive integer");
  if (!Array.isArray(raw.resource_ids)) throw new AppError(400, "resource_ids must be an array");
  if (!raw.resource_ids.every(isPositiveInteger)) {
    throw new AppError(400, "resource_ids must contain only positive integers");
  }
  const duplicates = findDuplicateIds(raw.resource_ids);
  if (duplicates.length > 0) throw new AppError(400, `resource_ids has duplicated ids: ${duplicates.join(", ")}`);
  return { role_id: raw.role_id, resource_ids: [...raw.resource_ids] };
}

export function findDuplicateIds(ids: readonly number[]): number[] {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates].sort((left, right) => left - right);
}
