import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionStore } from '../services/session-store';
import { authInterceptor } from './auth-interceptor';

const API = environment.apiUrl;
const TOKENS = (access: string, refresh: string) => ({
  access_token: access,
  token_type: 'Bearer' as const,
  expires_in: 900,
  refresh_token: refresh,
  refresh_expires_in: 604800,
});

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let session: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('should add the Bearer header but not to /sesion/login', () => {
    session.setTokens(TOKENS('acc-1', 'ref-1'));
    http.get(`${API}/clientes`).subscribe();
    http.post(`${API}/sesion/login`, {}).subscribe();

    expect(backend.expectOne(`${API}/clientes`).request.headers.get('Authorization')).toBe(
      'Bearer acc-1',
    );
    expect(backend.expectOne(`${API}/sesion/login`).request.headers.has('Authorization')).toBe(
      false,
    );
  });

  it('should share ONE refresh among concurrent 401s and retry them all', () => {
    session.setTokens(TOKENS('viejo', 'ref-1'));
    const urls = ['clientes', 'productos', 'ventas'].map((r) => `${API}/${r}`);
    const ok: string[] = [];
    urls.forEach((url) => http.get(url).subscribe(() => ok.push(url)));

    urls.forEach((url) =>
      backend
        .expectOne(url)
        .flush({ error: 'expired' }, { status: 401, statusText: 'Unauthorized' }),
    );

    const refresh = backend.match(`${API}/sesion/refresh`);
    expect(refresh.length).toBe(1);
    expect(refresh[0].request.body).toEqual({ refresh_token: 'ref-1' });
    refresh[0].flush(TOKENS('nuevo', 'ref-2'));

    urls.forEach((url) => {
      const retry = backend.expectOne(url);
      expect(retry.request.headers.get('Authorization')).toBe('Bearer nuevo');
      retry.flush({});
    });
    expect(ok.length).toBe(3);
    expect(session.refreshToken()).toBe('ref-2');
  });

  it('should clear the session and go to /login when there is no refresh token', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    let failed = false;
    http.get(`${API}/clientes`).subscribe({ error: () => (failed = true) });
    backend.expectOne(`${API}/clientes`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(navigate).toHaveBeenCalledWith(
      ['/login'],
      expect.objectContaining({ queryParams: expect.any(Object) }),
    );
  });

  it('should go to /login when the refresh itself fails', () => {
    session.setTokens(TOKENS('viejo', 'ref-1'));
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    http.get(`${API}/clientes`).subscribe({ error: () => undefined });
    backend.expectOne(`${API}/clientes`).flush({}, { status: 401, statusText: 'Unauthorized' });
    backend
      .expectOne(`${API}/sesion/refresh`)
      .flush({ error: 'reuse' }, { status: 401, statusText: 'Unauthorized' });

    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: expect.objectContaining({ reason: 'expired' }),
    });
    expect(session.isAuthenticated()).toBe(false);
  });
});
