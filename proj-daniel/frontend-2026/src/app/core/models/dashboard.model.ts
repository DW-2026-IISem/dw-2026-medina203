import { Product } from './product.model';
import { Sale } from './sale.model';

export interface DashboardStats {
  clients: number;
  productTypes: number;
  products: number;
  lowStock: number;
  sales: number;
  revenue: number;
}

export interface DashboardData {
  stats: DashboardStats;
  lowStockProducts: Product[];
  latestSales: Sale[];
}
