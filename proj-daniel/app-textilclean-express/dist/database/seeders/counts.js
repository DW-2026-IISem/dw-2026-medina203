"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SEED_COUNTS = void 0;
exports.resolveSeedCounts = resolveSeedCounts;
exports.DEFAULT_SEED_COUNTS = {
    clients: 10,
    users: 2,
    product_types: 25,
    products: 15,
    sales: 10,
    product_sales: 25,
};
function resolveSeedCounts(argv = process.argv.slice(2)) {
    const counts = { ...exports.DEFAULT_SEED_COUNTS };
    const envClients = process.env.SEED_CLIENTS;
    if (envClients !== undefined && envClients !== "") {
        counts.clients = Number(envClients);
    }
    const envUsers = process.env.SEED_USERS;
    if (envUsers !== undefined && envUsers !== "") {
        counts.users = Number(envUsers);
    }
    const envProductTypes = process.env.SEED_PRODUCT_TYPES;
    if (envProductTypes !== undefined && envProductTypes !== "") {
        counts.product_types = Number(envProductTypes);
    }
    const envProducts = process.env.SEED_PRODUCTS;
    if (envProducts !== undefined && envProducts !== "") {
        counts.products = Number(envProducts);
    }
    const envSales = process.env.SEED_SALES;
    if (envSales !== undefined && envSales !== "") {
        counts.sales = Number(envSales);
    }
    const envProductSales = process.env.SEED_PRODUCT_SALES;
    if (envProductSales !== undefined && envProductSales !== "") {
        counts.product_sales = Number(envProductSales);
    }
    for (const arg of argv) {
        const m = arg.match(/^--([a-zA-Z_]+)=(\d+)$/);
        if (!m)
            continue;
        const key = m[1];
        const value = Number(m[2]);
        if (key in counts) {
            counts[key] = value;
        }
    }
    return counts;
}
//# sourceMappingURL=counts.js.map