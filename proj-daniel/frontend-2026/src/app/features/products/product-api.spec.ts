import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ProductApi } from './product-api';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/productos`;

describe('ProductApi', () => {
  let api: ProductApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProductApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps products from list()', () => {
    let out: unknown;
    api.list().subscribe((r) => (out = r));
    http.expectOne(BASE).flush({ products: [{ id: 1, name: 'Detergente' }] });
    expect(out).toEqual([{ id: 1, name: 'Detergente' }]);
  });

  it('GETs a single product', () => {
    let out: unknown;
    api.get(1).subscribe((r) => (out = r));
    http.expectOne(`${BASE}/1`).flush({ product: { id: 1, name: 'Detergente' } });
    expect(out).toEqual({ id: 1, name: 'Detergente' });
  });

  it('POSTs a new product', () => {
    api
      .create({
        name: 'Detergente',
        brand: 'Marca',
        price: 10,
        min_stock: 2,
        quantity: 5,
        product_type_id: 1,
      })
      .subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush({ product: { id: 9 } });
  });

  it('PATCHes without status', () => {
    api.update(2, { quantity: 3 }).subscribe();
    const req = http.expectOne(`${BASE}/2`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ quantity: 3 });
    req.flush({ product: { id: 2 } });
  });

  it('PATCHes /deactivate', () => {
    api.deactivate(3).subscribe();
    const req = http.expectOne(`${BASE}/3/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('DELETEs physically', () => {
    api.remove(3).subscribe();
    const req = http.expectOne(`${BASE}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
