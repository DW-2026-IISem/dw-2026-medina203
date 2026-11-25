import { ProcessStatus, ServiceOrder } from './service-order.model';

/** Indicadores del panel de TextilClean (calculados en el cliente). */
export interface DashboardStats {
  customers: number;
  services: number;
  /** Órdenes no entregadas (en planta). */
  openOrders: number;
  /** Órdenes listas para entregar. */
  readyOrders: number;
  /** Valor de las órdenes ya entregadas. */
  deliveredRevenue: number;
  /** Valor de las órdenes todavía en planta. */
  pendingRevenue: number;
  byStatus: Record<ProcessStatus, number>;
}

export interface DashboardData {
  stats: DashboardStats;
  latestOrders: ServiceOrder[];
  /** Órdenes cuya fecha de entrega ya pasó y no se han entregado. */
  overdueOrders: ServiceOrder[];
}
