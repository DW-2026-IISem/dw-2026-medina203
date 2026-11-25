import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { ServiceOrderItemForm } from '../service-order-item-form/service-order-item-form';
import { ServiceOrderItemList } from './service-order-item-list';

const API = environment.apiUrl;

describe('ServiceOrderItemList y ServiceOrderItemForm', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ServiceOrderItemList, ServiceOrderItemForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        ConfirmationService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadList() {
    const list = TestBed.createComponent(ServiceOrderItemList).componentInstance;
    http.expectOne(`${API}/detalle-ordenes`).flush({
      service_order_items: [
        {
          id: 1,
          service_order_id: 10,
          laundry_service_id: 2,
          quantity: 5,
          weight_kg: '3.50',
          unit_price: '5500.00',
          line_total: '19250.00',
          status: 'active',
        },
        {
          id: 2,
          service_order_id: 11,
          laundry_service_id: 6,
          quantity: 4,
          weight_kg: null,
          unit_price: '2500.00',
          line_total: '10000.00',
          status: 'active',
        },
      ],
    });
    http
      .expectOne((r) => r.url === `${API}/ordenes`)
      .flush({
        service_orders: [
          { id: 10, customer_id: 1, process_status: 'in_process' },
          { id: 11, customer_id: 1, process_status: 'delivered' },
        ],
      });
    http.expectOne(`${API}/servicios`).flush({ laundry_services: [] });
    return list;
  }

  it('filtra por orden y suma los totales visibles', () => {
    const list = loadList();
    expect(list.visibleTotal()).toBe(29250);
    list.orderFilter.set(11);
    expect(list.visibleRows().map((r) => r.id)).toEqual([2]);
  });

  it('solo las órdenes no entregadas son editables o reciben líneas', () => {
    const list = loadList();
    expect(list.isEditable(list.rows()[0])).toBe(true);
    expect(list.isEditable(list.rows()[1])).toBe(false);
    expect(list.openOrders().map((o) => o.id)).toEqual([10]);
  });

  it('al editar solo envía prendas y peso', () => {
    const list = loadList();
    list.openEdit(list.rows()[0]);
    list.save({ service_order_id: 10, laundry_service_id: 2, quantity: 6, weight_kg: 4 });
    const req = http.expectOne({ method: 'PATCH', url: `${API}/detalle-ordenes/1` });
    expect(req.request.body).toEqual({ quantity: 6, weight_kg: 4 });
  });

  it('el formulario exige peso para servicios por kg', () => {
    const fixture = TestBed.createComponent(ServiceOrderItemForm);
    fixture.componentRef.setInput('services', [
      { id: 2, name: 'Lavado', billing_unit: 'kg', price: 5500 },
    ]);
    fixture.detectChanges();
    const form = fixture.componentInstance;
    const emitted: unknown[] = [];
    form.saved.subscribe((p) => emitted.push(p));

    form.form.patchValue({ service_order_id: 10, laundry_service_id: 2, quantity: 3 });
    form.submit();
    expect(emitted).toHaveLength(0);

    form.form.patchValue({ weight_kg: 2.5 });
    form.submit();
    expect(emitted[0]).toEqual({
      service_order_id: 10,
      laundry_service_id: 2,
      quantity: 3,
      weight_kg: 2.5,
    });
  });
});
