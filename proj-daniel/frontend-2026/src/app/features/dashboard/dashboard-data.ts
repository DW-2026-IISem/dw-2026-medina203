import { Customer } from '../../core/models/customer.model';
import { DashboardData } from '../../core/models/dashboard.model';
import { LaundryService } from '../../core/models/laundry-service.model';
import { ServiceOrder } from '../../core/models/service-order.model';
import { toNumber } from '../../core/utils/to-number';

/**
 * Calcula los indicadores del panel a partir de las tres consultas.
 * Es una función pura: se prueba sin HTTP ni componentes.
 */
export function buildDashboard(
  customers: Customer[],
  services: LaundryService[],
  orders: ServiceOrder[],
  now: Date = new Date(),
): DashboardData {
  const byStatus = { received: 0, in_process: 0, ready: 0, delivered: 0 };
  let deliveredRevenue = 0;
  let pendingRevenue = 0;

  for (const order of orders) {
    byStatus[order.process_status] += 1;
    if (order.process_status === 'delivered') deliveredRevenue += toNumber(order.total);
    else pendingRevenue += toNumber(order.total);
  }

  const open = orders.filter((o) => o.process_status !== 'delivered');

  return {
    stats: {
      customers: customers.length,
      services: services.length,
      openOrders: open.length,
      readyOrders: byStatus.ready,
      deliveredRevenue,
      pendingRevenue,
      byStatus,
    },
    latestOrders: [...orders]
      .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
      .slice(0, 6),
    overdueOrders: open
      .filter((o) => o.delivery_date && new Date(o.delivery_date).getTime() < now.getTime())
      .sort((a, b) => new Date(a.delivery_date!).getTime() - new Date(b.delivery_date!).getTime()),
  };
}
