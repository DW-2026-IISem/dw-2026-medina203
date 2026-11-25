import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { ServiceOrder } from '../../../core/models/service-order.model';
import { ServiceOrderList } from './service-order-list';

const API = environment.apiUrl;
const ORDER: ServiceOrder = {
  id: 7,
  customer_id: 1,
  received_at: '2026-11-20T08:00:00Z',
  delivery_date: '2026-11-21T08:00:00Z',
  process_status: 'received',
  notes: null,
  subtotal: '100000.00',
  tax: '0.00',
  discount: '0.00',
  total: '100000.00',
  status: 'active',
  customer: { id: 1, business_name: 'Hotel Waya', tax_id: '900123456-7' },
};

describe('ServiceOrderList', () => {
  let http: HttpTestingController;
  let list: ServiceOrderList;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ServiceOrderList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        ConfirmationService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    list = TestBed.createComponent(ServiceOrderList).componentInstance;
    http.expectOne(`${API}/clientes`).flush({ customers: [] });
    http
      .expectOne((r) => r.url === `${API}/ordenes`)
      .flush({
        service_orders: [
          ORDER,
          { ...ORDER, id: 8, total: '50000.00', process_status: 'delivered' },
        ],
      });
  });

  afterEach(() => http.verify());

  it('suma los totales de las órdenes visibles', () => {
    expect(list.totalAmount()).toBe(150000);
  });

  it('ofrece el siguiente estado y nada para una orden entregada', () => {
    expect(list.nextLabel(list.rows()[0])).toBe('En proceso');
    expect(list.nextLabel(list.rows()[1])).toBeNull();
  });

  it('avanza el proceso con PATCH /ordenes/:id/estado', () => {
    list.advance(list.rows()[0]);
    const req = http.expectOne(`${API}/ordenes/7/estado`);
    expect(req.request.body).toEqual({ process_status: 'in_process' });
    req.flush({ service_order: { ...ORDER, process_status: 'in_process' } });
    expect(list.rows()[0].process_status).toBe('in_process');
  });

  it('el filtro por estado vuelve a consultar al backend', () => {
    list.setStatusFilter('ready');
    const req = http.expectOne((r) => r.url === `${API}/ordenes`);
    expect(req.request.params.get('process_status')).toBe('ready');
    req.flush({ service_orders: [] });
    expect(list.rows()).toEqual([]);
  });
});
