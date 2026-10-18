"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const dto_1 = require("./dto");
const products_repository_1 = require("./products.repository");
const product_types_repository_1 = require("../product-types/product-types.repository");
const app_error_1 = require("../../../shared/errors/app-error");
class ProductsService {
    constructor(repository = new products_repository_1.ProductsRepository(), productTypesRepository = new product_types_repository_1.ProductTypesRepository()) {
        this.repository = repository;
        this.productTypesRepository = productTypesRepository;
    }
    async getAll() {
        const products = await this.repository.findAllActive();
        return products.map(dto_1.toProductResponse);
    }
    async getOne(id) {
        return (0, dto_1.toProductResponse)(await this.findOrFail(id));
    }
    async create(body) {
        await this.assertActiveProductType(body.product_type_id);
        const product = await this.repository.create({
            name: body.name,
            brand: body.brand,
            price: body.price,
            min_stock: body.min_stock,
            quantity: body.quantity,
            product_type_id: body.product_type_id,
            status: body.status ?? "active",
        });
        return (0, dto_1.toProductResponse)(product);
    }
    async updatePut(id, body) {
        const product = await this.findOrFail(id);
        await this.assertActiveProductType(body.product_type_id);
        await this.repository.update(product, {
            name: body.name,
            brand: body.brand,
            price: body.price,
            min_stock: body.min_stock,
            quantity: body.quantity,
            product_type_id: body.product_type_id,
        });
        return (0, dto_1.toProductResponse)(product);
    }
    async updatePatch(id, body) {
        const product = await this.findOrFail(id);
        if (body.product_type_id !== undefined) {
            await this.assertActiveProductType(body.product_type_id);
        }
        await this.repository.update(product, body);
        return (0, dto_1.toProductResponse)(product);
    }
    async deletePhysical(id) {
        const product = await this.findOrFail(id, false);
        await this.repository.delete(product);
    }
    async deleteLogical(id) {
        const product = await this.findOrFail(id);
        await this.repository.update(product, { status: "inactive" });
        return (0, dto_1.toProductResponse)(product);
    }
    async findOrFail(id, onlyActive = true) {
        const product = await this.repository.findById(id);
        if (!product || (onlyActive && product.status !== "active")) {
            throw new app_error_1.AppError(404, "Product not found");
        }
        return product;
    }
    async assertActiveProductType(productTypeId) {
        const productType = await this.productTypesRepository.findById(productTypeId);
        if (!productType)
            throw new app_error_1.AppError(404, "Product type not found");
        if (productType.status !== "active") {
            throw new app_error_1.AppError(400, "Product type must be active");
        }
    }
}
exports.ProductsService = ProductsService;
//# sourceMappingURL=products.service.js.map