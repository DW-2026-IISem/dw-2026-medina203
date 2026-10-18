"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const clients_repository_1 = require("../clients/clients.repository");
const products_repository_1 = require("../products/products.repository");
const product_sales_repository_1 = require("../product-sales/product-sales.repository");
const with_transaction_1 = require("../../../shared/database/with-transaction");
const app_error_1 = require("../../../shared/errors/app-error");
const dto_1 = require("./dto");
const sales_repository_1 = require("./sales.repository");
class SalesService {
    constructor(repository = new sales_repository_1.SalesRepository(), clientsRepository = new clients_repository_1.ClientsRepository(), productsRepository = new products_repository_1.ProductsRepository(), productSalesRepository = new product_sales_repository_1.ProductSalesRepository()) {
        this.repository = repository;
        this.clientsRepository = clientsRepository;
        this.productsRepository = productsRepository;
        this.productSalesRepository = productSalesRepository;
    }
    async getAll() {
        const sales = await this.repository.findAllActive();
        return sales.map(dto_1.toSaleResponse);
    }
    async getOne(id) {
        return (0, dto_1.toSaleResponse)(await this.findOrFail(id));
    }
    async create(body) {
        this.validateCreate(body);
        const tax = money(body.tax ?? 0, "tax");
        const discounts = money(body.discounts ?? 0, "discounts");
        const saleDate = body.sale_date ? new Date(body.sale_date) : new Date();
        if (!Number.isFinite(saleDate.getTime()))
            throw new app_error_1.AppError(400, "Invalid sale_date");
        return (0, with_transaction_1.withTransaction)(async (transaction) => {
            const client = await this.clientsRepository.findById(body.client_id, transaction);
            if (!client || client.status !== "active")
                throw new app_error_1.AppError(404, "Active client not found");
            const sale = await this.repository.create({
                client_id: client.id,
                sale_date: saleDate,
                subtotal: 0,
                tax,
                discounts,
                total: roundMoney(tax - discounts),
                status: "active",
            }, transaction);
            const quantities = new Map();
            for (const item of body.items) {
                quantities.set(item.product_id, (quantities.get(item.product_id) ?? 0) + item.quantity);
            }
            const products = new Map();
            for (const productId of [...quantities.keys()].sort((a, b) => a - b)) {
                const product = await this.productsRepository.findByIdForUpdate(productId, transaction);
                if (!product)
                    throw new app_error_1.AppError(404, `Product ${productId} not found`);
                if (product.status !== "active")
                    throw new app_error_1.AppError(400, `Product ${productId} is inactive`);
                if (product.quantity < quantities.get(productId)) {
                    throw new app_error_1.AppError(400, `Insufficient stock for product ${productId}`);
                }
                products.set(productId, product);
            }
            let subtotal = 0;
            for (const item of body.items) {
                const product = products.get(item.product_id);
                const unitPrice = Number(product.price);
                const lineTotal = roundMoney(unitPrice * item.quantity);
                subtotal = roundMoney(subtotal + lineTotal);
                await this.productSalesRepository.create({
                    sale_id: sale.id,
                    product_id: product.id,
                    quantity: item.quantity,
                    unit_price: unitPrice,
                    line_total: lineTotal,
                    status: "active",
                }, transaction);
            }
            if (discounts > roundMoney(subtotal + tax)) {
                throw new app_error_1.AppError(400, "discounts cannot exceed subtotal plus tax");
            }
            for (const [productId, quantity] of quantities) {
                const product = products.get(productId);
                await this.productsRepository.update(product, { quantity: product.quantity - quantity }, transaction);
            }
            await this.repository.update(sale, { subtotal, total: roundMoney(subtotal + tax - discounts) }, transaction);
            return (0, dto_1.toSaleResponse)(sale);
        });
    }
    async updatePut(id, body) {
        return this.update(id, body);
    }
    async updatePatch(id, body) {
        return this.update(id, body);
    }
    async deleteLogical(id) {
        return (0, with_transaction_1.withTransaction)(async (transaction) => {
            const sale = await this.requireActiveForUpdate(id, transaction);
            const activeRows = await this.productSalesRepository.findActiveBySaleId(id, transaction);
            const products = await this.lockProducts(activeRows.map((row) => row.product_id), transaction);
            for (const row of activeRows) {
                const product = products.get(row.product_id);
                if (product) {
                    await this.productsRepository.update(product, { quantity: product.quantity + row.quantity }, transaction);
                    products.set(product.id, product);
                }
            }
            await this.productSalesRepository.deactivateBySaleId(id, transaction);
            await this.repository.update(sale, { status: "inactive" }, transaction);
            return (0, dto_1.toSaleResponse)(sale);
        });
    }
    async deletePhysical(id) {
        await (0, with_transaction_1.withTransaction)(async (transaction) => {
            const sale = await this.requireActiveForUpdate(id, transaction);
            const activeRows = await this.productSalesRepository.findActiveBySaleId(id, transaction);
            const products = await this.lockProducts(activeRows.map((row) => row.product_id), transaction);
            for (const row of activeRows) {
                const product = products.get(row.product_id);
                if (product) {
                    await this.productsRepository.update(product, { quantity: product.quantity + row.quantity }, transaction);
                    products.set(product.id, product);
                }
            }
            await this.productSalesRepository.deleteBySaleId(id, transaction);
            await this.repository.delete(sale, transaction);
        });
    }
    async update(id, body) {
        return (0, with_transaction_1.withTransaction)(async (transaction) => {
            const sale = await this.requireActiveForUpdate(id, transaction);
            const tax = body.tax === undefined ? Number(sale.tax) : money(body.tax, "tax");
            const discounts = body.discounts === undefined
                ? Number(sale.discounts)
                : money(body.discounts, "discounts");
            const saleDate = body.sale_date === undefined ? sale.sale_date : new Date(body.sale_date);
            if (!Number.isFinite(saleDate.getTime()))
                throw new app_error_1.AppError(400, "Invalid sale_date");
            if (discounts > roundMoney(Number(sale.subtotal) + tax)) {
                throw new app_error_1.AppError(400, "discounts cannot exceed subtotal plus tax");
            }
            await this.repository.update(sale, {
                sale_date: saleDate,
                tax,
                discounts,
                total: roundMoney(Number(sale.subtotal) + tax - discounts),
            }, transaction);
            return (0, dto_1.toSaleResponse)(sale);
        });
    }
    validateCreate(body) {
        if (!Number.isInteger(body.client_id) || body.client_id < 1) {
            throw new app_error_1.AppError(400, "client_id must be a positive integer");
        }
        if (!Array.isArray(body.items) || body.items.length === 0) {
            throw new app_error_1.AppError(400, "At least one sale item is required");
        }
        if (body.items.some((item) => !Number.isInteger(item.product_id) || item.product_id < 1 ||
            !Number.isInteger(item.quantity) || item.quantity < 1)) {
            throw new app_error_1.AppError(400, "Each item requires a product_id and positive integer quantity");
        }
    }
    async findOrFail(id) {
        const sale = await this.repository.findById(id);
        if (!sale || sale.status !== "active")
            throw new app_error_1.AppError(404, "Sale not found");
        return sale;
    }
    async requireActiveForUpdate(id, transaction) {
        const sale = await this.repository.findByIdForUpdate(id, transaction);
        if (!sale || sale.status !== "active")
            throw new app_error_1.AppError(404, "Sale not found");
        return sale;
    }
    async lockProducts(productIds, transaction) {
        const products = new Map();
        for (const productId of [...new Set(productIds)].sort((a, b) => a - b)) {
            const product = await this.productsRepository.findByIdForUpdate(productId, transaction);
            if (product)
                products.set(productId, product);
        }
        return products;
    }
}
exports.SalesService = SalesService;
function money(value, field) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0)
        throw new app_error_1.AppError(400, `${field} must be non-negative`);
    return roundMoney(amount);
}
function roundMoney(amount) {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
}
//# sourceMappingURL=sales.service.js.map