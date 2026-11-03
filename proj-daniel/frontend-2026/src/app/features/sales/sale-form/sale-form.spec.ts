import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { SaleForm } from './sale-form';
import { environment } from '../../../../environments/environment';

const CLIENTS_URL = `${environment.apiUrl}/clientes`;
const PRODUCTS_URL = `${environment.apiUrl}/productos`;
const SALES_URL = `${environment.apiUrl}/ventas`;

const CLIENTS = [
  { id: 1, name: 'Tienda Sur', status: 'active' as const },
];

const PRODUCTS = [
  { id: 1, name: 'Detergente', brand: 'M', price: 10, min_stock: 2, quantity: 5, product_type_id: 1, status: 'active' as const },
  { id: 2, name: 'Jabón', brand: 'M', price: 3, min_stock: 1, quantity: 2, product_type_id: 1, status: 'active' as const },
];

describe('SaleForm', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'ventas', children: [] }]),
        MessageService,
        providePrimeNG({ theme: { preset: Aura } }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function crear() {
    const fixture = TestBed.createComponent(SaleForm);
    fixture.detectChanges();
    http.expectOne(CLIENTS_URL).flush({ clients: CLIENTS });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
    await fixture.whenStable();
    return { fixture, form: fixture.componentInstance };
  }

  it('should reject addLine without product', async () => {
    const { form } = await crear();
    form.addLine();
    expect(form.error()).toContain('Selecciona un producto');
  });

  it('should reject quantity < 1', async () => {
    const { form } = await crear();
    form.selectedProductId.set(1);
    form.quantity.set(0);
    form.addLine();
    expect(form.error()).toContain('al menos 1');
  });

  it('should reject stock > available', async () => {
    const { form } = await crear();
    form.selectedProductId.set(2); // stock 2
    form.quantity.set(3);
    form.addLine();
    expect(form.error()).toContain('Stock insuficiente');
  });

  it('should merge lines of same product', async () => {
    const { form } = await crear();
    form.selectedProductId.set(1);
    form.quantity.set(1);
    form.addLine();
    form.selectedProductId.set(1);
    form.quantity.set(2);
    form.addLine();
    expect(form.lines()).toEqual([{ product_id: 1, quantity: 3 }]);
  });

  it('should recompute subtotal and total', async () => {
    const { form } = await crear();
    form.selectedProductId.set(1); // precio 10
    form.quantity.set(2);
    form.addLine();
    form.selectedProductId.set(2); // precio 3
    form.quantity.set(1);
    form.addLine();
    form.tax.set(5);
    form.discounts.set(2);

    expect(form.subtotal()).toBe(23);
    expect(form.total()).toBe(26);
  });

  it('should not call backend if client is missing', async () => {
    const { form } = await crear();
    form.selectedProductId.set(1);
    form.quantity.set(1);
    form.addLine();
    form.save();
    expect(form.error()).toContain('cliente');
    http.expectNone(SALES_URL);
  });

  it('should POST a transactional payload and navigate', async () => {
    const { form } = await crear();
    form.clientId.set(1);
    form.selectedProductId.set(1);
    form.quantity.set(2);
    form.addLine();
    form.tax.set(19);
    form.discounts.set(0);
    form.save();

    const post = http.expectOne(SALES_URL);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      client_id: 1,
      tax: 19,
      discounts: 0,
      items: [{ product_id: 1, quantity: 2 }],
    });
    post.flush({ sale: { id: 10 }, items: [] });
  });
});
