"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSalesService = void 0;
const dto_1 = require("./dto");
const product_sales_repository_1 = require("./product-sales.repository");
const sales_repository_1 = require("../sales/sales.repository");
const products_repository_1 = require("../products/products.repository");
const app_error_1 = require("../../../shared/errors/app-error");
const with_transaction_1 = require("../../../shared/database/with-transaction");
class ProductSalesService {
    constructor(repository = new product_sales_repository_1.ProductSalesRepository(), salesRepository = new sales_repository_1.SalesRepository(), productsRepository = new products_repository_1.ProductsRepository()) {
        this.repository = repository;
        this.salesRepository = salesRepository;
        this.productsRepository = productsRepository;
    }
    async getAll() {
        const rows = await this.repository.findAllActive();
        return rows.map(dto_1.toProductSaleResponse);
    }
    async getOne(id) {
        return (0, dto_1.toProductSaleResponse)(await this.findOrFail(id));
    }
    async create(body) {
        if (!Number.isInteger(body.sale_id) || body.sale_id < 1 ||
            !Number.isInteger(body.product_id) || body.product_id < 1 ||
            !Number.isInteger(body.quantity) || body.quantity < 1) {
            throw new app_error_1.AppError(400, "sale_id, product_id and quantity (>=1) are required");
        }
        return (0, with_transaction_1.withTransaction)(async (transaction) => {
            const sale = await this.salesRepository.findByIdForUpdate(body.sale_id, transaction);
            if (!sale || sale.status !== "active")
                throw new app_error_1.AppError(404, "Sale not found");
            const product = await this.productsRepository.findByIdForUpdate(body.product_id, transaction);
            if (!product)
                throw new app_error_1.AppError(404, "Product not found");
            if (product.status !== "active")
                throw new app_error_1.AppError(400, "Product must be active");
            if (product.quantity < body.quantity) {
                throw new app_error_1.AppError(400, `Insufficient stock (available: ${product.quantity})`);
            }
            const unitPrice = Number(product.price);
            const productSale = await this.repository.create({
                sale_id: sale.id,
                product_id: product.id,
                quantity: body.quantity,
                unit_price: unitPrice,
                line_total: roundMoney(unitPrice * body.quantity),
                status: "active",
            }, transaction);
            await this.productsRepository.update(product, { quantity: product.quantity - body.quantity }, transaction);
            await this.recalcSaleTotals(sale.id, transaction);
            return (0, dto_1.toProductSaleResponse)(productSale);
        });
    }
    async updatePut(id, body) {
        return this.updateQuantity(id, body.quantity);
    }
    async updatePatch(id, body) {
        if (body.quantity === undefined)
            return this.getOne(id);
        return this.updateQuantity(id, body.quantity);
    }
    async deletePhysical(id) {
        await (0, with_transaction_1.withTransaction)(async (transaction) => {
            const { productSale, product } = await this.lockLine(id, transaction, false);
            if (productSale.status === "active" && product) {
                await this.productsRepository.update(product, { quantity: product.quantity + productSale.quantity }, transaction);
            }
            const saleId = productSale.sale_id;
            await this.repository.delete(productSale, transaction);
            await this.recalcSaleTotals(saleId, transaction);
        });
    }
    async deleteLogical(id) {
        return (0, with_transaction_1.withTransaction)(async (transaction) => {
            const { productSale, product } = await this.lockLine(id, transaction);
            if (product) {
                await this.productsRepository.update(product, { quantity: product.quantity + productSale.quantity }, transaction);
            }
            await this.repository.update(productSale, { status: "inactive" }, transaction);
            await this.recalcSaleTotals(productSale.sale_id, transaction);
            return (0, dto_1.toProductSaleResponse)(productSale);
        });
    }
    async updateQuantity(id, rawQuantity) {
        const quantity = Number(rawQuantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new app_error_1.AppError(400, "quantity must be a positive integer");
        }
        return (0, with_transaction_1.withTransaction)(async (transaction) => {
            const { productSale, product } = await this.lockLine(id, transaction);
            if (!product)
                throw new app_error_1.AppError(404, "Product not found");
            const delta = quantity - productSale.quantity;
            if (delta > 0 && product.status !== "active") {
                throw new app_error_1.AppError(400, "Product must be active");
            }
            if (delta > 0 && product.quantity < delta) {
                throw new app_error_1.AppError(400, `Insufficient stock (available: ${product.quantity})`);
            }
            if (delta !== 0) {
                await this.productsRepository.update(product, { quantity: product.quantity - delta }, transaction);
            }
            await this.repository.update(productSale, { quantity, line_total: roundMoney(Number(productSale.unit_price) * quantity) }, transaction);
            await this.recalcSaleTotals(productSale.sale_id, transaction);
            return (0, dto_1.toProductSaleResponse)(productSale);
        });
    }
    async findOrFail(id, onlyActive = true) {
        const productSale = await this.repository.findById(id);
        if (!productSale || (onlyActive && productSale.status !== "active")) {
            throw new app_error_1.AppError(404, "Product sale not found");
        }
        return productSale;
    }
    async lockLine(id, transaction, onlyActive = true) {
        const snapshot = await this.repository.findById(id, transaction);
        if (!snapshot)
            throw new app_error_1.AppError(404, "Product sale not found");
        const sale = await this.salesRepository.findByIdForUpdate(snapshot.sale_id, transaction);
        if (!sale || sale.status !== "active")
            throw new app_error_1.AppError(404, "Sale not found");
        const product = await this.productsRepository.findByIdForUpdate(snapshot.product_id, transaction);
        const productSale = await this.repository.findByIdForUpdate(id, transaction);
        if (!productSale || (onlyActive && productSale.status !== "active")) {
            throw new app_error_1.AppError(404, "Product sale not found");
        }
        return { productSale, product };
    }
    async recalcSaleTotals(saleId, transaction) {
        const rows = await this.repository.findActiveBySaleId(saleId, transaction);
        const subtotal = roundMoney(rows.reduce((sum, row) => sum + Number(row.line_total), 0));
        const sale = await this.salesRepository.findById(saleId, transaction);
        if (!sale)
            return;
        const total = roundMoney(subtotal + Number(sale.tax) - Number(sale.discounts));
        await this.salesRepository.update(sale, { subtotal, total }, transaction);
    }
}
exports.ProductSalesService = ProductSalesService;
function roundMoney(amount) {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
}
//# sourceMappingURL=product-sales.service.js.map