/**
 * Cantidad de registros por feature/entidad.
 * Prioridad: CLI (--clients=N) > env (SEED_CLIENTS) > default de este archivo.
 *
 * Cuando agregues features, suma aquí la clave y léela en el runner.
 */
export type SeedCounts = {
  clients: number;
  users: number;
  // roles?: number;
    product_types: number;
    products: number;
    sales: number;
    product_sales: number;
};

export const DEFAULT_SEED_COUNTS: SeedCounts = {
  clients: 10,
  users: 2,
    product_types: 25,
    products: 15,
    sales: 10,
    product_sales: 25,
};
 
export function resolveSeedCounts(argv: string[] = process.argv.slice(2)): SeedCounts {
  const counts: SeedCounts = { ...DEFAULT_SEED_COUNTS };

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
    if (!m) continue;
    const key = m[1] as keyof SeedCounts;
    const value = Number(m[2]);
    if (key in counts) {
      counts[key] = value;
    }
  }

  return counts;
}
