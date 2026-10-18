"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsRepository = void 0;
const product_model_1 = require("./product.model");
class ProductsRepository {
    async findAllActive() {
        return product_model_1.Product.findAll({ where: { status: "active" } });
    }
    async findById(id, transaction) {
        return product_model_1.Product.findByPk(id, { transaction });
    }
    async findByIdForUpdate(id, transaction) {
        return product_model_1.Product.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    }
    async create(data) {
        return product_model_1.Product.create(data);
    }
    async update(product, data, transaction) {
        return product.update(data, { transaction });
    }
    async delete(product) {
        await product.destroy();
    }
}
exports.ProductsRepository = ProductsRepository;
//# sourceMappingURL=products.repository.js.map