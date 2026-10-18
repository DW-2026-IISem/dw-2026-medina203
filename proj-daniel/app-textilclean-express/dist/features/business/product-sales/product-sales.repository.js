"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSalesRepository = void 0;
const product_sale_model_1 = require("./product-sale.model");
class ProductSalesRepository {
    async findAllActive() {
        return product_sale_model_1.ProductSale.findAll({ where: { status: "active" } });
    }
    async findById(id, transaction) {
        return product_sale_model_1.ProductSale.findByPk(id, { transaction });
    }
    async findByIdForUpdate(id, transaction) {
        return product_sale_model_1.ProductSale.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    }
    async findActiveBySaleId(saleId, transaction) {
        return product_sale_model_1.ProductSale.findAll({
            where: { sale_id: saleId, status: "active" },
            transaction,
        });
    }
    async create(data, transaction) {
        return product_sale_model_1.ProductSale.create(data, { transaction });
    }
    async update(productSale, data, transaction) {
        return productSale.update(data, { transaction });
    }
    async delete(productSale, transaction) {
        await productSale.destroy({ transaction });
    }
    async deleteBySaleId(saleId, transaction) {
        return product_sale_model_1.ProductSale.destroy({ where: { sale_id: saleId }, transaction });
    }
    async deactivateBySaleId(saleId, transaction) {
        const [affected] = await product_sale_model_1.ProductSale.update({ status: "inactive" }, { where: { sale_id: saleId, status: "active" }, transaction });
        return affected;
    }
}
exports.ProductSalesRepository = ProductSalesRepository;
//# sourceMappingURL=product-sales.repository.js.map