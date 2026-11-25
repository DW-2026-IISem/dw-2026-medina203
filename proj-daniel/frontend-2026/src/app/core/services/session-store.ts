import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AccessPayload, EffectivePermission, SessionTokens } from '../models/auth.model';
import { HttpMethod, Resource } from '../models/resource.model';
import { Role } from '../models/role.model';
import { User } from '../models/user.model';

const STORAGE_KEY = 'textilclean.session.v2';

interface PersistedSession {
  accessToken: string;
  refreshToken: string;
  user: User | null;
  permissions: EffectivePermission[];
}

/**
 * Única fuente de verdad de la sesión en el cliente.
 * Todo se expone como signals de solo lectura y se deriva con computed().
 *
 * Contrato del backend `app-textilclean-express`:
 *  - `POST /api/sesion/login`  → solo tokens.
 *  - `GET  /api/sesion/perfil` → `{ user }`.
 *  - `GET  /api/permisos`      → `{ permissions: EffectivePermission[] }`.
 *
 * Seguridad: el backend sigue siendo la autoridad. `can()` solo decide qué
 * pintar en la UI; aunque se fuerce el menú, Express responde 401/403.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  readonly authEnabled = environment.requireAuth;

  private readonly _accessToken = signal<string | null>(null);
  private readonly _refreshToken = signal<string | null>(null);
  private readonly _user = signal<User | null>(null);
  private readonly _permissions = signal<EffectivePermission[]>([]);

  readonly accessToken = this._accessToken.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly permissions = this._permissions.asReadonly();

  readonly isAuthenticated = computed(() => this._accessToken() !== null);

  /** Roles activos: los que trae el perfil más los que aparecen en los permisos. */
  readonly roleNames = computed(() =>
    [
      ...new Set([...(this._user()?.roles ?? []), ...this._permissions().map((p) => p.role_name)]),
    ].sort(),
  );

  /** Nombre para mostrar: nombre completo del perfil o, si no hay, el username. */
  readonly displayName = computed(() => {
    const user = this._user();
    return user?.full_name?.trim() || user?.username || '';
  });

  readonly roles = computed<Role[]>(() => {
    const byId = new Map<number, Role>();
    for (const p of this._permissions()) {
      if (!byId.has(p.role_id)) {
        byId.set(p.role_id, {
          id: p.role_id,
          name: p.role_name,
          description: null,
          status: 'active',
        });
      }
    }
    return [...byId.values()];
  });

  readonly resources = computed<Resource[]>(() =>
    this._permissions().map((p) => ({
      id: p.resource_id,
      method: p.method,
      path: p.path,
      description: p.description,
      status: 'active' as const,
    })),
  );

  readonly permissionsIndex = computed(
    () => new Set(this._permissions().map((p) => `${p.method} ${p.path}`)),
  );

  readonly permissionCount = computed(() => this._permissions().length);

  constructor() {
    this.restore();
  }

  setTokens(tokens: SessionTokens): void {
    this._accessToken.set(tokens.access_token);
    this._refreshToken.set(tokens.refresh_token);
    this.persist();
  }

  setAccess(access: AccessPayload): void {
    this._user.set(access.user);
    this._permissions.set(access.permissions ?? []);
    this.persist();
  }

  clear(): void {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    this._permissions.set([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  can(method: HttpMethod | string, path: string): boolean {
    if (!this.authEnabled) {
      return true;
    }
    const verb = method.toUpperCase();
    const requestPath = path.split('?')[0];
    return this._permissions().some((p) => p.method === verb && pathMatches(p.path, requestPath));
  }

  canPermission(permission: string): boolean {
    if (!this.authEnabled) {
      return true;
    }
    const separator = permission.indexOf(' ');
    if (separator < 0) {
      return false;
    }
    return this.can(permission.slice(0, separator), permission.slice(separator + 1));
  }

  hasRole(name: string): boolean {
    return this.roleNames().includes(name.toUpperCase());
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as PersistedSession;
      if (!Array.isArray(data.permissions)) {
        this.clear();
        return;
      }
      this._accessToken.set(data.accessToken ?? null);
      this._refreshToken.set(data.refreshToken ?? null);
      this._user.set(data.user ?? null);
      this._permissions.set(data.permissions ?? []);
    } catch {
      this.clear();
    }
  }

  private persist(): void {
    const data: PersistedSession = {
      accessToken: this._accessToken() ?? '',
      refreshToken: this._refreshToken() ?? '',
      user: this._user(),
      permissions: this._permissions(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* modo privado o cuota llena */
    }
  }
}

function pathMatches(pattern: string, path: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\/:[^/]+/g, '/[^/]+');
  return new RegExp(`^${escaped}$`).test(path);
}
