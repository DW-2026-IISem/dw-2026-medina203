import { Transaction } from "sequelize";
import { sequelize } from "../../database/db";

/**
 * Ejecuta `work` dentro de una transacción (patrón *unit of work*).
 *
 * - Commit si `work` termina bien.
 * - Rollback si `work` lanza (y re-lanza el error).
 *
 * Lo usan los services que tocan varias tablas a la vez
 * (ej. crear una venta = `sales` + `product_sales` + stock de `products`).
 */
export async function withTransaction<T>(
  work: (transaction: Transaction) => Promise<T>
): Promise<T> {
  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const result = await work(transaction);
    await transaction.commit();
    committed = true;
    return result;
  } catch (error) {
    if (!committed) {
      await transaction.rollback().catch(() => undefined);
    }
    throw error;
  }
}
