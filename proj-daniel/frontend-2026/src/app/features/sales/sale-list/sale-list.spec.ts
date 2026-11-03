import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SaleList } from './sale-list';
import { environment } from '../../../../environments/environment';

const CLIENTS_URL = `${environment.apiUrl}/clientes`;
const PRODUCTS_URL = `${environment.apiUrl}/productos`;
const SALES_URL = `${environment.apiUrl}/ventas`;
const LINES_URL = `${environment.apiUrl}/detalle-ventas`;

const CLIENTS = [{ id: 1, name: 'Tienda Sur', status: 'active' as const }];
const PRODUCTS = [{ id: 1, name: 'Detergente', price: 10, status: 'active' as const }];
const SALES = [
  {
    id: 10,
    client_id: 1,
    subtotal: 20,
    tax: 4,
    discounts: 0,
    total: 24,
    status: 'active' as const,
    sale_date: '2026-01-01T00:00:00Z',
    items: [{ id: 1, sale_id: 10, product_id: 1, quantity: 2, unit_price: 10, line_total: 20, status: 'active' as const }],
  },
];

describe('SaleList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        ConfirmationService,
        providePrimeNG({ theme: { preset: Aura } }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function crearLista() {
    const fixture = TestBed.createComponent(SaleList);
    fixture.detectChanges();
    http.expectOne(SALES_URL).flush({ sales: SALES });
    http.expectOne(CLIENTS_URL).flush({ clients: CLIENTS });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
    await fixture.whenStable();
    return { fixture, lista: fixture.componentInstance };
  }

  it('should resolve client name and count items', async () => {
    const { lista } = await crearLista();
    expect(lista.clientName()(1)).toBe('Tienda Sur');
    expect(lista.items(SALES[0])).toBe(2);
  });

  it('should load the lines of a sale without items from /detalle-ventas', async () => {
    const { lista } = await crearLista();
    const { items: _omit, ...sinLineas } = SALES[0];
    lista.openDetail(sinLineas);
    expect(lista.detailVisible()).toBe(true);
    expect(lista.detailLoading()).toBe(true);
    http.expectOne(LINES_URL).flush({
      product_sales: [
        { id: 1, sale_id: 10, product_id: 1, quantity: 2, unit_price: 10, line_total: 20, status: 'active' },
        { id: 2, sale_id: 99, product_id: 1, quantity: 5, unit_price: 10, line_total: 50, status: 'active' },
      ],
    });
    expect(lista.detailLoading()).toBe(false);
    expect(lista.selected()?.items?.map((line) => line.id)).toEqual([1]);
  });

  it('should call deactivate after confirmation', async () => {
    const { lista } = await crearLista();
    const confirmacion = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmacion, 'confirm').mockImplementation((opts: any) => {
      opts.accept?.();
      return confirmacion;
    });
    lista.deactivate(SALES[0]);
    const baja = http.expectOne(`${SALES_URL}/10/deactivate`);
    expect(baja.request.method).toBe('PATCH');
    baja.flush({});
    http.expectOne(SALES_URL).flush({ sales: [] });
    http.expectOne(CLIENTS_URL).flush({ clients: CLIENTS });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
  });

  it('should call DELETE for physical removal', async () => {
    const { lista } = await crearLista();
    const confirmacion = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmacion, 'confirm').mockImplementation((opts: any) => {
      opts.accept?.();
      return confirmacion;
    });
    lista.remove(SALES[0]);
    const del = http.expectOne(`${SALES_URL}/10`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
    http.expectOne(SALES_URL).flush({ sales: [] });
    http.expectOne(CLIENTS_URL).flush({ clients: CLIENTS });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
  });
});
