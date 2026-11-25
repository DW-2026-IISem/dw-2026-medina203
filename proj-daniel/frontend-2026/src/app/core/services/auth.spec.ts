import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';
import { SessionStore } from './session-store';

const API = environment.apiUrl;

describe('AuthService', () => {
  let http: HttpTestingController;
  let auth: AuthService;
  let session: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('login guarda los tokens y luego pide perfil y permisos en paralelo', () => {
    auth.login({ identifier: 'operador', password: 'Operador123!' }).subscribe();

    const login = http.expectOne(`${API}/sesion/login`);
    expect(login.request.body).toEqual({ identifier: 'operador', password: 'Operador123!' });
    login.flush({
      access_token: 'acc',
      token_type: 'Bearer',
      expires_in: 900,
      refresh_token: 'ref',
      refresh_expires_in: 604800,
    });
    expect(session.accessToken()).toBe('acc');

    http.expectOne(`${API}/sesion/perfil`).flush({
      user: {
        id: 2,
        username: 'operador',
        full_name: 'Operario de planta',
        email: 'o@x',
        avatar: null,
        status: 'active',
        roles: ['OPERATOR'],
      },
    });
    http.expectOne(`${API}/permisos`).flush({
      permissions: [
        {
          resource_id: 1,
          method: 'PATCH',
          path: '/api/ordenes/:id/estado',
          description: null,
          role_id: 2,
          role_name: 'OPERATOR',
        },
      ],
    });

    expect(session.displayName()).toBe('Operario de planta');
    expect(session.roleNames()).toEqual(['OPERATOR']);
    expect(session.can('PATCH', '/api/ordenes/15/estado')).toBe(true);
    expect(session.can('DELETE', '/api/ordenes/15')).toBe(false);
  });

  it('si el perfil falla, la sesión se limpia', () => {
    let failed = false;
    auth.login({ identifier: 'admin', password: 'x' }).subscribe({ error: () => (failed = true) });
    http.expectOne(`${API}/sesion/login`).flush({ access_token: 'a', refresh_token: 'r' });
    http
      .expectOne(`${API}/sesion/perfil`)
      .flush({ error: 'User not found' }, { status: 404, statusText: 'Not Found' });
    // forkJoin cancela la petición de permisos al fallar el perfil.
    expect(http.expectOne(`${API}/permisos`).cancelled).toBe(true);
    expect(failed).toBe(true);
    expect(session.isAuthenticated()).toBe(false);
  });

  it('logout envía el refresh token y limpia aunque el backend falle', () => {
    session.setTokens({
      access_token: 'a',
      token_type: 'Bearer',
      expires_in: 1,
      refresh_token: 'r',
      refresh_expires_in: 1,
    });
    auth.logout().subscribe();
    const req = http.expectOne(`${API}/sesion/logout`);
    expect(req.request.body).toEqual({ refresh_token: 'r' });
    req.flush({}, { status: 500, statusText: 'Error' });
    expect(session.isAuthenticated()).toBe(false);
  });
});
