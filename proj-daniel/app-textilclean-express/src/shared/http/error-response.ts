import { Response } from "express";
import { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } from "sequelize";
import { AppError } from "../errors/app-error";

/**
 * Traduce cualquier error a una respuesta HTTP JSON `{ error }`.
 *
 * - `AppError`                  → su `statusCode` (reglas de negocio).
 * - `UniqueConstraintError`     → 409 (ej. NIT o correo repetido).
 * - `ValidationError`           → 400 (validaciones del modelo Sequelize).
 * - `ForeignKeyConstraintError` → 409 (el registro tiene dependientes).
 * - Cualquier otro              → 500.
 */
export function sendError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (error instanceof UniqueConstraintError) {
    const fields = Object.keys(error.fields ?? {}).join(", ");
    res.status(409).json({ error: `Duplicate value${fields ? ` for: ${fields}` : ""}` });
    return;
  }
  if (error instanceof ValidationError) {
    res.status(400).json({ error: error.errors.map((e) => e.message).join("; ") || error.message });
    return;
  }
  if (error instanceof ForeignKeyConstraintError) {
    res.status(409).json({ error: "The record is referenced by other records" });
    return;
  }
  res.status(500).json({ error: "Internal server error", detail: String(error) });
}
