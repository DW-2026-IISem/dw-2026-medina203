"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = withTransaction;
const db_1 = require("../../database/db");
/**
 * Ejecuta `work` dentro de una transacción (patrón *unit of work*).
 *
 * - Commit si `work` termina bien.
 * - Rollback si `work` lanza (y re-lanza el error).
 *
 * Lo usan los services que tocan varias tablas a la vez
 * (ej. crear una venta = `sales` + `product_sales` + stock de `products`).
 */
async function withTransaction(work) {
    const transaction = await db_1.sequelize.transaction();
    let committed = false;
    try {
        const result = await work(transaction);
        await transaction.commit();
        committed = true;
        return result;
    }
    catch (error) {
        if (!committed) {
            await transaction.rollback().catch(() => undefined);
        }
        throw error;
    }
}
//# sourceMappingURL=with-transaction.js.map