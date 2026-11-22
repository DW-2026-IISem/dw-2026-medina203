import { AppError } from "../errors/app-error";

/** Redondea a 2 decimales (pesos con centavos) evitando errores de coma flotante. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Valida que `value` sea un número finito ≥ 0 y lo redondea; si no, 400. */
export function nonNegativeMoney(value: unknown, field: string): number {
  const amount = Number(value);
  if (value === null || value === "" || !Number.isFinite(amount) || amount < 0) {
    throw new AppError(400, `${field} must be a non-negative number`);
  }
  return roundMoney(amount);
}
