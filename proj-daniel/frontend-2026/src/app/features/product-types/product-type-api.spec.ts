import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ProductTypeApi } from './product-type-api';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/tipos-producto`;

describe('ProductTypeApi', () => {
  let api: ProductTypeApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProductTypeApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps product_types from list()', () => {
    let out: unknown;
    api.list().subscribe((r) => (out = r));
    http.expectOne(BASE).flush({ product_types: [{ id: 1, name: 'Aseo' }] });
    expect(out).toEqual([{ id: 1, name: 'Aseo' }]);
  });

  it('GETs a single type', () => {
    let out: unknown;
    api.get(1).subscribe((r) => (out = r));
    http.expectOne(`${BASE}/1`).flush({ product_type: { id: 1, name: 'Aseo' } });
    expect(out).toEqual({ id: 1, name: 'Aseo' });
  });

  it('POSTs a new type', () => {
    let out: unknown;
    api.create({ name: 'Congelados', description: null }).subscribe(
      (r) => (out = r),
    );
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush({ product_type: { id: 9, name: 'Congelados' } });
    expect(out).toEqual({ id: 9, name: 'Congelados' });
  });

  it('PATCHes without status', () => {
    api.update(2, { name: 'Nuevo' }).subscribe();
    const req = http.expectOne(`${BASE}/2`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'Nuevo' });
    req.flush({ product_type: { id: 2, name: 'Nuevo' } });
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
