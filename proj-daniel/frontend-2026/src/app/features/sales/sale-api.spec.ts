import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SaleApi } from './sale-api';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/ventas`;

describe('SaleApi', () => {
  let api: SaleApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(SaleApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps sales from list()', () => {
    let out: unknown;
    api.list().subscribe((r) => (out = r));
    http.expectOne(BASE).flush({ sales: [{ id: 1 }] });
    expect(out).toEqual([{ id: 1 }]);
  });

  it('POSTs a transactional creation without prices', () => {
    api
      .create({
        client_id: 1,
        tax: 19,
        discounts: 0,
        items: [{ product_id: 3, quantity: 2 }],
      })
      .subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      client_id: 1,
      tax: 19,
      discounts: 0,
      items: [{ product_id: 3, quantity: 2 }],
    });
    req.flush({ sale: { id: 10 }, items: [] });
  });

  it('PATCHes /deactivate', () => {
    api.deactivate(5).subscribe();
    const req = http.expectOne(`${BASE}/5/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('DELETEs physically', () => {
    api.remove(5).subscribe();
    const req = http.expectOne(`${BASE}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
