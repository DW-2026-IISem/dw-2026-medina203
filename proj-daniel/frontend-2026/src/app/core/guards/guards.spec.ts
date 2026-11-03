import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { SessionStore } from '../services/session-store';
import { authGuard } from './auth-guard';
import { guestGuard } from './guest-guard';
import { permissionGuard } from './permission-guard';

function ruta(permission?: string): ActivatedRouteSnapshot {
  return { data: permission ? { permission } : {} } as unknown as ActivatedRouteSnapshot;
}
const estado = (url: string) => ({ url }) as RouterStateSnapshot;

describe('guards', () => {
  let session: SessionStore;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
  });

  afterEach(() => localStorage.clear());

  const run = <T>(fn: () => T) => TestBed.runInInjectionContext(fn);

  function iniciarSesion(paths: string[]): void {
    session.setTokens({
      access_token: 'a',
      token_type: 'Bearer',
      expires_in: 900,
      refresh_token: 'r',
      refresh_expires_in: 1,
    });
    session.setAccess({
      user: null as never,
      permissions: paths.map((p, i) => {
        const [method, path] = p.split(' ');
        return {
          resource_id: i,
          method: method as 'GET',
          path,
          description: null,
          role_id: 2,
          role_name: 'SELLER',
        };
      }),
    });
  }

  it('authGuard sends an anonymous user to /login with returnUrl', () => {
    const result = run(() => authGuard(ruta(), estado('/clientes'))) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fclientes');
  });

  it('authGuard lets an authenticated user in', () => {
    iniciarSesion([]);
    expect(run(() => authGuard(ruta(), estado('/clientes')))).toBe(true);
  });

  it('guestGuard sends an authenticated user away from /login', () => {
    iniciarSesion([]);
    const result = run(() => guestGuard(ruta(), estado('/login'))) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/dashboard');
  });

  it('permissionGuard allows a granted permission', () => {
    iniciarSesion(['GET /api/clientes']);
    expect(run(() => permissionGuard(ruta('GET /api/clientes'), estado('/clientes')))).toBe(true);
  });

  it('permissionGuard sends a missing permission to /forbidden', () => {
    iniciarSesion(['GET /api/clientes']);
    const result = run(() =>
      permissionGuard(ruta('GET /api/tipos-producto'), estado('/tipos-producto')),
    ) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/forbidden?permission=GET%20%2Fapi%2Ftipos-producto');
  });
});
