import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { LaundryService } from '../../../core/models/laundry-service.model';
import { ServiceOrderForm } from './service-order-form';

const API = environment.apiUrl;
const BY_KG: LaundryService = {
  id: 2,
  name: 'Lavado y secado - Sábanas',
  description: null,
  price: '5500.00',
  billing_unit: 'kg',
  estimated_hours: 24,
  garment_type_id: 1,
  status: 'active',
};
const BY_UNIT: LaundryService = {
  id: 6,
  name: 'Planchado - Uniformes',
  description: null,
  price: '2500.00',
  billing_unit: 'unit',
  estimated_hours: 72,
  garment_type_id: 7,
  status: 'active',
};

describe('ServiceOrderForm', () => {
  let http: HttpTestingController;
  let form: ServiceOrderForm;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ServiceOrderForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    form = TestBed.createComponent(ServiceOrderForm).componentInstance;
    http
      .expectOne(`${API}/clientes`)
      .flush({ customers: [{ id: 1, business_name: 'Hotel Waya' }] });
    http.expectOne(`${API}/servicios`).flush({ laundry_services: [BY_KG, BY_UNIT] });
  });

  afterEach(() => http.verify());

  function addLine(serviceId: number, quantity: number, weight: number | null) {
    form.selectedServiceId.set(serviceId);
    form.quantity.set(quantity);
    form.weightKg.set(weight);
    form.addLine();
  }

  it('exige el peso en servicios cobrados por kg', () => {
    addLine(2, 10, null);
    expect(form.lines()).toHaveLength(0);
    expect(form.error()).toContain('se cobra por kg');
    expect(form.needsWeight()).toBe(true);
  });

  it('calcula por kg (precio × peso) y por unidad (precio × prendas)', () => {
    addLine(2, 40, 12.5); // 5500 × 12.5 = 68 750
    addLine(6, 5, null); //  2500 × 5    = 12 500
    expect(form.lineTotal(form.lines()[0])).toBe(68750);
    expect(form.lineTotal(form.lines()[1])).toBe(12500);
    expect(form.subtotal()).toBe(81250);

    form.tax.set(1000);
    form.discount.set(250);
    expect(form.total()).toBe(82000);
  });

  it('estima la entrega con el mayor tiempo de los servicios elegidos', () => {
    addLine(2, 1, 1);
    addLine(6, 1, null);
    const hours = (form.estimatedDelivery()!.getTime() - Date.now()) / 3_600_000;
    expect(Math.round(hours)).toBe(72);
  });

  it('no envía sin cliente ni con descuento mayor al total', () => {
    addLine(6, 2, null);
    form.save();
    expect(form.error()).toContain('cliente');
    form.customerId.set(1);
    form.discount.set(999_999);
    form.save();
    expect(form.error()).toContain('descuento');
  });

  it('envía un solo POST con todas las líneas y vuelve a /ordenes', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    form.customerId.set(1);
    form.notes.set('  Urgente ');
    addLine(2, 40, 18.5);
    addLine(6, 25, null);
    form.save();

    const req = http.expectOne({ method: 'POST', url: `${API}/ordenes` });
    expect(req.request.body).toEqual({
      customer_id: 1,
      notes: 'Urgente',
      tax: 0,
      discount: 0,
      items: [
        { laundry_service_id: 2, quantity: 40, weight_kg: 18.5 },
        { laundry_service_id: 6, quantity: 25, weight_kg: null },
      ],
    });
    req.flush({ service_order: { id: 31 } });
    expect(navigate).toHaveBeenCalledWith(['/ordenes']);
  });
});
