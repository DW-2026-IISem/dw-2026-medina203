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
import { ProductSaleList } from './product-sale-list';
import { environment } from '../../../../environments/environment';

const LINES_URL = `${environment.apiUrl}/detalle-ventas`;
const SALES_URL = `${environment.apiUrl}/ventas`;
const PRODUCTS_URL = `${environment.apiUrl}/productos`;

const LINES = [
  { id: 1, sale_id: 10, product_id: 1, quantity: 2, unit_price: 10, line_total: 20, status: 'active' as const },
];
const SALES = [{ id: 10, total: 20, status: 'active' as const }];
const PRODUCTS = [{ id: 1, name: 'Detergente', price: 10, status: 'active' as const }];

describe('ProductSaleList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductSaleList],
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
    const fixture = TestBed.createComponent(ProductSaleList);
    fixture.detectChanges();
    http.expectOne(LINES_URL).flush({ product_sales: LINES });
    http.expectOne(SALES_URL).flush({ sales: SALES });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
    await fixture.whenStable();
    return { fixture, lista: fixture.componentInstance };
  }

  it('should resolve product name', async () => {
    const { lista } = await crearLista();
    expect(lista.productName()(1)).toBe('Detergente');
    expect(lista.productName()(99)).toBe('Producto #99');
  });

  it('should PATCH only quantity in edit mode', async () => {
    const { lista } = await crearLista();
    lista.openEdit(LINES[0]);
    lista.save({ sale_id: 10, product_id: 1, quantity: 5 });
    const patch = http.expectOne(`${LINES_URL}/1`);
    expect(patch.request.body).toEqual({ quantity: 5 });
    patch.flush({ product_sale: LINES[0] });
    http.expectOne(LINES_URL).flush({ product_sales: LINES });
    http.expectOne(SALES_URL).flush({ sales: SALES });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
  });

  it('should call /deactivate after confirmation', async () => {
    const { lista } = await crearLista();
    const confirmacion = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmacion, 'confirm').mockImplementation((opts: any) => {
      opts.accept?.();
      return confirmacion;
    });
    lista.deactivate(LINES[0]);
    const baja = http.expectOne(`${LINES_URL}/1/deactivate`);
    expect(baja.request.method).toBe('PATCH');
    baja.flush({});
    http.expectOne(LINES_URL).flush({ product_sales: [] });
    http.expectOne(SALES_URL).flush({ sales: SALES });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
  });
});
