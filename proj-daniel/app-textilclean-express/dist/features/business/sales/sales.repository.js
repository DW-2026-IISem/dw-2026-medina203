"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesRepository = void 0;
const sale_model_1 = require("./sale.model");
class SalesRepository {
    async findAllActive() {
        return sale_model_1.Sale.findAll({ where: { status: "active" } });
    }
    async findById(id, transaction) {
        return sale_model_1.Sale.findByPk(id, { transaction });
    }
    async findByIdForUpdate(id, transaction) {
        return sale_model_1.Sale.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    }
    async create(data, transaction) {
        return sale_model_1.Sale.create(data, { transaction });
    }
    async update(sale, data, transaction) {
        return sale.update(data, { transaction });
    }
    async delete(sale, transaction) {
        await sale.destroy({ transaction });
    }
}
exports.SalesRepository = SalesRepository;
//# sourceMappingURL=sales.repository.js.map