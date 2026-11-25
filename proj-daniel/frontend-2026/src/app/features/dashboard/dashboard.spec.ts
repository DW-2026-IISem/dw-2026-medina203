import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ServiceOrder } from '../../core/models/service-order.model';
import { Dashboard } from './dashboard';
import { buildDashboard } from './dashboard-data';

const base: ServiceOrder = {
  id: 1,
  customer_id: 1,
  received_at: '2026-11-20T08:00:00Z',
  delivery_date: '2026-11-21T08:00:00Z',
  process_status: 'received',
  notes: null,
  subtotal: '0',
  tax: '0',
  discount: '0',
  total: '100000.00',
  status: 'active',
};

const ORDERS: ServiceOrder[] = [
  { ...base, id: 1 },
  {
    ...base,
    id: 2,
    process_status: 'ready',
    received_at: '2026-11-22T08:00:00Z',
    delivery_date: '2026-12-30T08:00:00Z',
    total: '50000',
  },
  { ...base, id: 3, process_status: 'delivered', total: 80000 },
];

describe('buildDashboard', () => {
  const now = new Date('2026-11-25T12:00:00Z');
  const d = buildDashboard([{} as never, {} as never], [{} as never], ORDERS, now);

  it('cuenta órdenes por estado y en planta', () => {
    expect(d.stats.byStatus).toEqual({ received: 1, in_process: 0, ready: 1, delivered: 1 });
    expect(d.stats.openOrders).toBe(2);
    expect(d.stats.readyOrders).toBe(1);
  });

  it('separa lo entregado de lo pendiente por cobrar', () => {
    expect(d.stats.deliveredRevenue).toBe(80000);
    expect(d.stats.pendingRevenue).toBe(150000);
  });

  it('ordena las últimas por fecha de recepción y detecta entregas vencidas', () => {
    expect(d.latestOrders[0].id).toBe(2);
    expect(d.overdueOrders.map((o) => o.id)).toEqual([1]);
  });
});

describe('Dashboard', () => {
  it('hace las 3 consultas en paralelo y arma los indicadores', () => {
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const http = TestBed.inject(HttpTestingController);
    const dashboard = TestBed.createComponent(Dashboard).componentInstance;
    const api = environment.apiUrl;

    http.expectOne(`${api}/clientes`).flush({ customers: [{ id: 1 }] });
    http.expectOne(`${api}/servicios`).flush({ laundry_services: [] });
    http.expectOne((r) => r.url === `${api}/ordenes`).flush({ service_orders: ORDERS });

    expect(dashboard.loading()).toBe(false);
    expect(dashboard.data()?.stats.customers).toBe(1);
    http.verify();
  });
});
