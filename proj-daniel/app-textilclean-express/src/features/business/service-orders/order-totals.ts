import { Transaction } from "sequelize";
import { roundMoney } from "../../../shared/utils/money";
import { ServiceOrder } from "./service-order.model";
import { ServiceOrdersRepository } from "./service-orders.repository";
import { ServiceOrderItemsRepository } from "../service-order-items/service-order-items.repository";

/**
 * Recalcula los totales de una orden a partir de sus líneas activas:
 *   subtotal = Σ line_total (activas)
 *   total    = subtotal + tax − discount
 *
 * Lo comparten ServiceOrdersService y ServiceOrderItemsService.
 */
export async function recalcOrderTotals(
  order: ServiceOrder,
  transaction: Transaction,
  ordersRepository = new ServiceOrdersRepository(),
  itemsRepository = new ServiceOrderItemsRepository()
): Promise<void> {
  const rows = await itemsRepository.findActiveByOrderId(order.id, transaction);
  const subtotal = roundMoney(rows.reduce((sum, row) => sum + Number(row.line_total), 0));
  const total = roundMoney(Math.max(0, subtotal + Number(order.tax) - Number(order.discount)));
  await ordersRepository.update(order, { subtotal, total }, transaction);
}
