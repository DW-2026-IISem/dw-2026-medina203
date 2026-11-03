import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { Dashboard } from './dashboard';
import { EffectivePermission } from '../../core/models/auth.model';
import { SessionStore } from '../../core/services/session-store';
import { environment } from '../../../environments/environment';

const CLIENTS_URL = `${environment.apiUrl}/clientes`;
const TYPES_URL = `${environment.apiUrl}/tipos-producto`;
const PRODUCTS_URL = `${environment.apiUrl}/productos`;
const SALES_URL = `${environment.apiUrl}/ventas`;

function permisos(...paths: string[]): EffectivePermission[] {
  return paths.map((path, i) => ({
    resource_id: i + 1,
    method: 'GET',
    path,
    description: null,
    role_id: 1,
    role_name: 'ADMIN',
  }));
}

const TODOS = permisos('/api/clientes', '/api/tipos-producto', '/api/productos', '/api/ventas');

describe('Dashboard', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        providePrimeNG({ theme: { preset: Aura } }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  function conPermisos(lista: EffectivePermission[]): void {
    TestBed.inject(SessionStore).setAccess({ user: null as never, permissions: lista });
  }

  async function crear() {
    conPermisos(TODOS);
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    http.expectOne(CLIENTS_URL).flush({ clients: [{ id: 1 }] });
    http.expectOne(TYPES_URL).flush({ product_types: [{ id: 1 }, { id: 2 }] });
    http.expectOne(PRODUCTS_URL).flush({
      products: [
        { id: 1, name: 'Detergente', quantity: 1, min_stock: 3, status: 'active' },
        { id: 2, name: 'Jabón', quantity: 5, min_stock: 2, status: 'active' },
      ],
    });
    http.expectOne(SALES_URL).flush({
      sales: [
        { id: 10, total: '25.50', status: 'active', sale_date: '2026-01-01T00:00:00Z' },
        { id: 11, total: 10, status: 'active', sale_date: '2026-02-01T00:00:00Z' },
      ],
    });
    await fixture.whenStable();
    return fixture.componentInstance;
  }

  it('should compute lowStock by min_stock', async () => {
    const dash = await crear();
    expect(dash.lowStock().map((p) => p.name)).toEqual(['Detergente']);
  });

  it('should sum revenue normalizing DECIMAL strings', async () => {
    const dash = await crear();
    expect(dash.revenue()).toBe(35.5);
  });

  it('should sort latest sales by date desc', async () => {
    const dash = await crear();
    expect(dash.latestSales().map((s) => s.id)).toEqual([11, 10]);
  });

  it('should skip the sources the role cannot read (SELLER without product types)', async () => {
    conPermisos(permisos('/api/clientes', '/api/productos', '/api/ventas'));
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    http.expectOne(CLIENTS_URL).flush({ clients: [{ id: 1 }] });
    http.expectNone(TYPES_URL);
    http.expectOne(PRODUCTS_URL).flush({ products: [] });
    http.expectOne(SALES_URL).flush({ sales: [{ id: 1, total: 7, status: 'active' }] });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBeNull();
    expect(fixture.componentInstance.revenue()).toBe(7);
    expect(fixture.nativeElement.textContent).not.toContain('Tipos');
  });
});
