import { TestBed } from '@angular/core/testing';
import { EffectivePermission } from '../models/auth.model';
import { SessionStore } from './session-store';

const KEY = 'textilclean.session.v1';

const PERMISOS: EffectivePermission[] = [
  { resource_id: 1, method: 'GET', path: '/api/clientes', description: null, role_id: 2, role_name: 'SELLER' },
  { resource_id: 2, method: 'PATCH', path: '/api/clientes/:id', description: null, role_id: 2, role_name: 'SELLER' },
];

describe('SessionStore', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  function crear(): SessionStore {
    TestBed.configureTestingModule({});
    return TestBed.inject(SessionStore);
  }

  it('should persist tokens, user and permissions under one key', () => {
    const store = crear();
    store.setTokens({
      access_token: 'a',
      token_type: 'Bearer',
      expires_in: 900,
      refresh_token: 'r',
      refresh_expires_in: 604800,
    });
    store.setAccess({
      user: { id: 2, username: 'seller', email: 's@x', avatar: null, status: 'active' },
      permissions: PERMISOS,
    });

    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    expect(Object.keys(saved).sort()).toEqual(['accessToken', 'permissions', 'refreshToken', 'user']);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.roleNames()).toEqual(['SELLER']);
    expect(store.permissionCount()).toBe(2);
  });

  it('should match :id placeholders and reject other methods', () => {
    const store = crear();
    store.setAccess({ user: null as never, permissions: PERMISOS });
    expect(store.can('PATCH', '/api/clientes/7')).toBe(true);
    expect(store.canPermission('GET /api/clientes')).toBe(true);
    expect(store.can('DELETE', '/api/clientes/7')).toBe(false);
    expect(store.canPermission('sin-espacio')).toBe(false);
  });

  it('should restore from storage and clear everything on clear()', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ accessToken: 'a', refreshToken: 'r', user: null, permissions: PERMISOS }),
    );
    const store = crear();
    expect(store.accessToken()).toBe('a');
    expect(store.permissionCount()).toBe(2);

    store.clear();
    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('should drop a corrupted storage entry', () => {
    localStorage.setItem(KEY, '{no-json');
    const store = crear();
    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
