import { AppError } from "../../../shared/errors/app-error";
import { roundMoney } from "../../../shared/utils/money";
import { BillingUnit } from "../laundry-services/laundry-service.model";

export interface OrderLineInput {
  quantity: unknown;
  weight_kg?: unknown;
}

export interface OrderLineValues {
  quantity: number;
  weight_kg: number | null;
  line_total: number;
}

/**
 * Valida cantidad/peso y calcula el total de una línea según la unidad de cobro.
 *
 * - `quantity`: entero ≥ 1 (número de prendas), siempre obligatorio.
 * - `weight_kg`: > 0, **obligatorio** si el servicio se cobra por kg.
 */
export function computeOrderLine(
  billingUnit: BillingUnit,
  unitPrice: number,
  input: OrderLineInput
): OrderLineValues {
  const quantity = Number(input.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError(400, "quantity must be a positive integer");
  }

  let weight: number | null = null;
  if (input.weight_kg !== undefined && input.weight_kg !== null) {
    weight = Number(input.weight_kg);
    if (!Number.isFinite(weight) || weight <= 0) {
      throw new AppError(400, "weight_kg must be greater than 0");
    }
    weight = roundMoney(weight);
  }
  if (billingUnit === "kg" && weight === null) {
    throw new AppError(400, "weight_kg is required for services billed by kg");
  }

  const base = billingUnit === "kg" ? (weight as number) : quantity;
  return { quantity, weight_kg: weight, line_total: roundMoney(unitPrice * base) };
}
