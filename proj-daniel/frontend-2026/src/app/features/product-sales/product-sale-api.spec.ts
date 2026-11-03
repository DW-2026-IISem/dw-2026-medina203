import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProductSaleApi } from './product-sale-api';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/detalle-ventas`;

describe('ProductSaleApi', () => {
  let api: ProductSaleApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProductSaleApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps product_sales from list()', () => {
    let out: unknown;
    api.list().subscribe((r) => (out = r));
    http.expectOne(BASE).flush({ product_sales: [{ id: 1 }] });
    expect(out).toEqual([{ id: 1 }]);
  });

  it('PATCHes only quantity', () => {
    api.update(2, { quantity: 3 }).subscribe();
    const req = http.expectOne(`${BASE}/2`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ quantity: 3 });
    req.flush({ product_sale: { id: 2 } });
  });

  it('PATCHes /deactivate', () => {
    api.deactivate(2).subscribe();
    const req = http.expectOne(`${BASE}/2/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('DELETEs physically', () => {
    api.remove(2).subscribe();
    const req = http.expectOne(`${BASE}/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
