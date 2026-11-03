# 🛠 ISS-08 · Autenticación JWT, perfil y permisos efectivos

> **Proyecto frontend:** `front-textilclean-express` (carpeta real: `frontend-2026`)
> **Ruta frontend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026`
> **Proyecto backend:** `app-textilclean-express`
> **Ruta backend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express`
> **Fase:** II · Auth + RBAC · Bloque **1 de 3** (sesión) · **Bloqueado por:** ISS-07 · **Habilita:** ISS-09
> **Vigencia:** revisión alineada con guía del docente del 23-oct-2026.
> **Capa:** 🛠 Construir (ejecutar, verificar y entregar)

---

## 0. Antes de tocar nada

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
pwd
```

Verifica que las piezas de **Fase I** están cerradas:

```bash
ls src/app/core/models/          # api  client  product-type  product  sale  product-sale  resource  role  user
ls src/app/core/utils/           # api-error  filter-rows  to-number
ls src/app/features/clients/ src/app/features/product-types/ src/app/features/products/ src/app/features/sales/ src/app/features/product-sales/ src/app/features/dashboard/
ls src/app/shared/ui/            # page-header  empty-state  status-tag
```

Si falta `resource.model.ts`, `role.model.ts` o `user.model.ts`, créalos ahora (los usa `SessionStore`):

```bash
cat > src/app/core/models/user.model.ts <<'EOF'
import { Status } from './api.model';

export interface User {
  id: number;
  username: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  status: Status;
  created_at?: string;
  updated_at?: string;
}
EOF

cat > src/app/core/models/role.model.ts <<'EOF'
import { Status } from './api.model';

export interface Role {
  id: number;
  name: string;
  description: string | null;
  status: Status;
}
EOF

cat > src/app/core/models/resource.model.ts <<'EOF'
import { Status } from './api.model';

export type HttpMethod =
  | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  | 'HEAD' | 'OPTIONS';

export interface Resource {
  id: number;
  method: HttpMethod;
  path: string;
  description: string | null;
  status: Status;
}
EOF
```

---

## Objetivo y alcance

Activar la **Fase II** contra el contrato real del backend `app-textilclean-express`.

> **Fase II · bloque 1 de 3 — Sesión.** Esta ISS entrega el **formulario de sesión** (`/login`), el **almacenamiento de tokens/perfil/permisos** y el **interceptor** que refresca. La protección de las pantallas de negocio es **ISS-09**; los formularios de usuarios, roles, recursos y pivotes son **ISS-10**.
>
> Al terminar esta ISS el CRUD de Fase I ya funciona contra el backend consolidado, pero **todavía sin guards ni botones filtrados**.

**Dos mitades del mismo interruptor:**

- **Frontend**: `environment.requireAuth = true`.
- **Backend**: `AUTH_ENABLED=true` en el `.env` de `app-textilclean-express`.

Con **una sola** activa, las peticiones de negocio reciben `401` (detalle en ISS-11 §11.1).

**Entregables de esta ISS:**

1. **`AuthService`** contra `/api/sesion/login`, `/perfil`, `/refresh`, `/logout` y `/api/permisos`.
2. **`SessionStore`** guarda tokens, perfil y permisos efectivos.
3. **`authInterceptor`** añade `Bearer` y recupera un `401` con **un solo refresh**.
4. **Login** con `returnUrl`, **pantalla de perfil** y **cierre de sesión**.

**Antes de construir:** estudia **tokens → perfil → permisos** en ese orden. Conecta login, luego persistencia, luego refresh. `Header` y `Aside` reciben los nuevos datos desde `Shell`.

**Evidencia de aprendizaje:** comprueba que `/construir` sigue abriendo **sin sesión** y que **no invoca** perfil, permisos ni refresh.

**Equipo y terminal:** Ubuntu WSL, terminal del editor, carpeta `frontend-2026`.

---

## Criterios de aceptación (ISS-08)

- [ ] Con `requireAuth: true` (frontend) y `AUTH_ENABLED=true` (backend), `/dashboard` sin sesión redirige a `/login?returnUrl=/dashboard`.
- [ ] Login con `admin / Admin123!` guarda tokens y carga perfil + permisos.
- [ ] DevTools → **Application → Local Storage** contiene `storelab.session.v1` con `accessToken`, `refreshToken`, `user` y `permissions`.
- [ ] Cada request protegida lleva `Authorization: Bearer <access>`.
- [ ] Al vencer el access, un `401` dispara **un refresh** y se reintenta.
- [ ] **Logout** borra el storage y vuelve al login; el refresh deja de servir.
- [ ] `ng serve` compila sin errores.

---

## 8.1 El contrato real (no lo inventes)

| Endpoint | Modalidad | Respuesta |
|---|---|---|
| `POST /api/sesion/login` | OPEN | **Solo tokens** |
| `POST /api/sesion/refresh` | OPEN (refresh en el cuerpo) | Solo tokens (rotados) |
| `POST /api/sesion/logout` | OPEN (refresh en el cuerpo) | `{ message }` |
| `GET /api/sesion/perfil` | JWT | `{ user }` |
| `GET /api/permisos` | JWT | `{ permissions }` |

```json
// POST /api/sesion/login  →  SessionTokens
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "9f2c...",
  "refresh_expires_in": 604800
}

// GET /api/permisos  →  { permissions: EffectivePermission[] }
{
  "permissions": [
    {
      "resource_id": 1,
      "method": "GET",
      "path": "/api/clientes",
      "description": "Listar clientes",
      "role_id": 1,
      "role_name": "ADMIN"
    }
  ]
}
```

> ⚠️ **Error clásico:** esperar `user`, `roles` y `resources` en el login. Aquí el login **solo emite tokens**. El frontend debe encadenar `forkJoin(perfil, permisos)` **después** de guardarlos.

### Modelo de seguridad

- **`access_token`**: JWT HS256 corto (`JWT_ACCESS_TTL = 900 s`). Se valida con firma, `iss` y `aud`; **NO lleva roles**.
- **`refresh_token`**: opaco (64 bytes base64url). Se guarda solo su **SHA-256**. Vive en `refresh_tokens` con `family_id` y `expires_at`.
- **Cada refresh rota**: invalida el presentado y emite uno nuevo en la misma familia. La ventana se reinicia (ventana deslizante).
- **Reuse detection**: si se presenta un refresh ya rotado → el backend **revoca toda la familia** y responde `401`.
- **`logout`** revoca el refresh presentado (**idempotente**). No revoca la familia.
- **Desactivar el usuario** invalida sus tokens en la siguiente petición (`authenticate` revalida `status` en la base).

> **Consecuencia para el frontend:** **nunca** dispares dos refresh en paralelo. El interceptor usa `refreshInFlight` para compartir la misma llamada.

> ⚠️ **Advertencia didáctica.** Guardar tokens en `localStorage` es vulnerable a **XSS**. En producción se prefieren cookies `HttpOnly + Secure + SameSite`. Aquí se usa `localStorage` para que el laboratorio sea observable en DevTools.

---

## 8.2 Activar Fase II

### 8.2.1 Backend

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express
# Edita .env:
#   AUTH_ENABLED=true
npm run dev
```

### 8.2.2 Frontend

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
cat > src/environments/environment.development.ts <<'EOF'
export const environment = {
  production: false,
  appName: 'TextilClean Express',
  apiUrl: 'http://localhost:4000/api',
  requireAuth: true,
  primeUiLicense: '',
};
EOF

cat > src/environments/environment.ts <<'EOF'
export const environment = {
  production: true,
  appName: 'TextilClean Express',
  apiUrl: 'http://localhost:4000/api',
  requireAuth: true,
  primeUiLicense: '',
};
EOF
```

> Con `requireAuth: true`, `SessionStore.canPermission()` **deja de ser permisivo** y el login es **obligatorio**. Si el backend quedó en modo laboratorio (`AUTH_ENABLED=false`), el frontend pide login pero la API acepta peticiones sin token; si el frontend queda en `false` con el backend protegido, **todo responde `401 Missing Bearer token`**.

---

## 8.3 Modelos de sesión

```bash
cat > src/app/core/models/auth.model.ts <<'EOF'
import { HttpMethod } from './resource.model';
import { User } from './user.model';

/** POST /api/sesion/login — `identifier` acepta username o email. */
export interface LoginRequest {
  identifier: string;
  password: string;
}

/** Respuesta de login y refresh: SOLO el par de tokens. */
export interface SessionTokens {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

/** GET /api/sesion/perfil */
export interface ProfilePayload {
  user: User;
}

/** Una fila de role_users → roles → resource_roles → resources (todo activo). */
export interface EffectivePermission {
  resource_id: number;
  method: HttpMethod;
  path: string;
  description: string | null;
  role_id: number;
  role_name: string;
}

/** GET /api/permisos · GET /api/usuarios/:id/permisos */
export interface PermissionsPayload {
  permissions: EffectivePermission[];
}

/** Estado compuesto que mantiene SessionStore. */
export interface AccessPayload {
  user: User;
  permissions: EffectivePermission[];
}
EOF
```

---

## 8.3A Generar interceptores funcionales

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
ng generate interceptor core/interceptors/auth --functional --skip-tests --defaults
ng generate interceptor core/interceptors/error --functional --skip-tests --defaults
```

> Generan `auth-interceptor.ts` y `error-interceptor.ts`. **Reemplaza el passthrough** del CLI por la implementación de esta ISS antes de registrarlos. **No** se usa `ng generate service` para interceptores.

---

## 8.4 HttpClient e interceptores

Edita `src/app/app.config.ts` para añadir los imports y los providers:

```bash
cat > src/app/app.config.ts <<'EOF'
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),

    // El orden importa: auth añade el Bearer y reintenta; error traduce fallos.
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),

    providePrimeNG({
      license: environment.primeUiLicense || undefined,
      ripple: true,
      inputVariant: 'outlined',
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: { name: 'primeng', order: 'theme, base, primeng, utilities' },
        },
      },
    }),

    MessageService,
    ConfirmationService,
  ],
};
EOF
```

**Cadena de una petición:**

```
Componente → authInterceptor (añade token, reintenta 401)
           → errorInterceptor (toast de 403/500/offline)
           → HttpBackend → Express
```

---

## 8.5 `SessionStore`

```bash
cat > src/app/core/services/session-store.ts <<'EOF'
import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  AccessPayload,
  EffectivePermission,
  SessionTokens,
} from '../models/auth.model';
import { HttpMethod, Resource } from '../models/resource.model';
import { Role } from '../models/role.model';
import { User } from '../models/user.model';

const STORAGE_KEY = 'textilclean.session.v1';

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

  readonly roleNames = computed(() =>
    [...new Set(this._permissions().map((p) => p.role_name))].sort(),
  );

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
    return this._permissions().some(
      (p) => p.method === verb && pathMatches(p.path, requestPath),
    );
  }

  canPermission(permission: string): boolean {
    if (!this.authEnabled) {
      return true;
    }
    const separator = permission.indexOf(' ');
    if (separator < 0) {
      return false;
    }
    return this.can(
      permission.slice(0, separator),
      permission.slice(separator + 1),
    );
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
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\/:[^/]+/g, '/[^/]+');
  return new RegExp(`^${escaped}$`).test(path);
}
EOF
```

> **Lo esencial:** persistimos `permissions`, **no** `roles` ni `resources`, porque los últimos se derivan con `computed`.

---

## 8.6 `AuthService`

```bash
cat > src/app/core/services/auth.ts <<'EOF'
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AccessPayload,
  LoginRequest,
  PermissionsPayload,
  ProfilePayload,
  SessionTokens,
} from '../models/auth.model';
import { SessionStore } from './session-store';

/**
 * Cliente del feature Session del backend `app-textilclean-express`.
 *
 * | Endpoint | Modalidad | Devuelve |
 * |---|---|---|
 * | `POST /api/sesion/login`   | OPEN | `SessionTokens` (solo tokens) |
 * | `GET  /api/sesion/perfil`  | JWT  | `{ user }` |
 * | `GET  /api/permisos`       | JWT  | `{ permissions }` (permisos efectivos) |
 * | `POST /api/sesion/refresh` | OPEN (refresh token) | `SessionTokens` |
 * | `POST /api/sesion/logout`  | OPEN (refresh token) | `{ message }` |
 *
 * El login NO devuelve usuario ni permisos: tras guardar los tokens se consulta
 * el perfil y la matriz efectiva en dos peticiones JWT (`forkJoin`).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);
  private readonly base = `${environment.apiUrl}/sesion`;
  private readonly permissionsUrl = `${environment.apiUrl}/permisos`;

  login(credentials: LoginRequest): Observable<AccessPayload> {
    return this.http
      .post<SessionTokens>(`${this.base}/login`, credentials)
      .pipe(
        tap((tokens) => this.session.setTokens(tokens)),
        switchMap(() =>
          this.me().pipe(
            catchError((error: unknown) => {
              this.session.clear();
              return throwError(() => error);
            }),
          ),
        ),
      );
  }

  me(): Observable<AccessPayload> {
    return forkJoin({
      profile: this.http.get<ProfilePayload>(`${this.base}/perfil`),
      permissions: this.http.get<PermissionsPayload>(this.permissionsUrl),
    }).pipe(
      map(({ profile, permissions }) => ({
        user: profile.user,
        permissions: permissions.permissions,
      })),
      tap((access) => this.session.setAccess(access)),
    );
  }

  refresh(): Observable<SessionTokens> {
    const refresh_token = this.session.refreshToken();
    if (!refresh_token) {
      return throwError(() => new Error('No hay refresh token en la sesión'));
    }
    return this.http
      .post<SessionTokens>(`${this.base}/refresh`, { refresh_token })
      .pipe(tap((tokens) => this.session.setTokens(tokens)));
  }

  logout(): Observable<unknown> {
    const refresh_token = this.session.refreshToken();
    return this.http.post(`${this.base}/logout`, { refresh_token }).pipe(
      catchError(() => of(null)),
      finalize(() => this.session.clear()),
    );
  }
}
EOF
```

> **`switchMap` tras el login.** `tap` guarda los tokens, pero `switchMap(() => this.me())` encadena la carga del perfil y los permisos. **`login()` no emite hasta que `me()` responde**: el componente navega al dashboard con la sesión **completa**, sin parpadeos ni menús vacíos.

---

## 8.7 Interceptor con refresh *single-flight*

### 8.7.1 `auth-interceptor.ts`

```bash
cat > src/app/core/interceptors/auth-interceptor.ts <<'EOF'
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionTokens } from '../models/auth.model';
import { AuthService } from '../services/auth';
import { SessionStore } from '../services/session-store';

/**
 * Una sola renovación en vuelo para todas las peticiones concurrentes.
 * Si 3 peticiones reciben 401 a la vez, solo se llama una vez a /sesion/refresh.
 */
let refreshInFlight: Observable<SessionTokens> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const auth = inject(AuthService);
  const router = inject(Router);

  const isPublicAuthCall =
    req.url.includes('/sesion/login') ||
    req.url.includes('/sesion/refresh') ||
    req.url.includes('/sesion/logout');

  const accessToken = session.accessToken();

  const request =
    accessToken && !isPublicAuthCall
      ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
      : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isPublicAuthCall
      ) {
        return throwError(() => error);
      }

      if (!environment.requireAuth) {
        return throwError(() => error);
      }

      if (!session.refreshToken()) {
        redirectToLogin(session, router);
        return throwError(() => error);
      }

      refreshInFlight ??= auth.refresh().pipe(
        catchError((refreshError: unknown) => {
          redirectToLogin(session, router);
          return throwError(() => refreshError);
        }),
        finalize(() => {
          refreshInFlight = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

      return refreshInFlight.pipe(
        switchMap(() => {
          const renewed = session.accessToken();
          const retried = req.clone({
            setHeaders: renewed
              ? { Authorization: `Bearer ${renewed}` }
              : {},
          });
          return next(retried);
        }),
      );
    }),
  );
};

function redirectToLogin(session: SessionStore, router: Router): void {
  session.clear();
  const returnUrl = router.url.startsWith('/login')
    ? '/dashboard'
    : router.url;
  void router.navigate(['/login'], { queryParams: { returnUrl } });
}
EOF
```

| Pieza | Por qué |
|---|---|
| `isPublicAuthCall` | login/refresh/logout no llevan `Bearer` ni se reintentan |
| `req.clone(...)` | las peticiones HTTP son **inmutables** |
| `refreshInFlight ??= ...` | si ya hay un refresh, se **comparte** el observable |
| `finalize` | libera el candado aunque el refresh falle |
| `shareReplay({ refCount: false })` | varios suscriptores reciben **una** respuesta |
| `switchMap` | espera el refresh y **reintenta** la petición original |

**Criterio de aceptación:** con **dos** peticiones simultáneas y access vencido, en Network debe verse **un solo** `POST /api/sesion/refresh` y **dos** reintentos.

### 8.7.2 `error-interceptor.ts` (mínimo)

```bash
cat > src/app/core/interceptors/error-interceptor.ts <<'EOF'
import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

/**
 * Traduce los fallos que el interceptor de auth no gestiona (401 ya resuelto).
 * Muestra toast para 403/500/offline. Los componentes pueden seguir manejando
 * el error por su cuenta (por ejemplo, `p-message` para el fallo de carga).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(MessageService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          notify.add({
            severity: 'error',
            summary: 'Sin conexión',
            detail: 'No se pudo contactar al servidor.',
          });
        } else if (error.status === 403) {
          notify.add({
            severity: 'warn',
            summary: 'Permiso insuficiente',
            detail: 'La operación no está permitida para tu rol.',
          });
        } else if (error.status >= 500) {
          notify.add({
            severity: 'error',
            summary: 'Error del servidor',
            detail: 'La operación no pudo completarse.',
          });
        }
      }
      return throwError(() => error);
    }),
  );
};
EOF
```

---

## 8.8 Login

### 8.8.1 Generar el componente

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
ng generate component features/auth/login --skip-tests --defaults
```

### 8.8.2 `login.ts`

```bash
cat > src/app/features/auth/login/login.ts <<'EOF'
import { Component, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../core/services/auth';
import { toApiMessage } from '../../../core/utils/api-error';

@Component({
  host: { class: 'block' },
  selector: 'app-login',
  imports: [
    ButtonModule,
    InputTextModule,
    MessageModule,
    PasswordModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { identifier, password } = this.form.getRawValue();
    this.auth.login({ identifier, password }).subscribe({
      next: () => {
        const requested =
          this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
        const returnUrl =
          requested.startsWith('/') && !requested.startsWith('/login')
            ? requested
            : '/dashboard';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(toApiMessage(error));
      },
    });
  }
}
EOF
```

### 8.8.3 `login.html`

```bash
cat > src/app/features/auth/login/login.html <<'EOF'
<main class="flex min-h-screen items-center justify-center bg-slate-100 p-6">
  <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <h1 class="text-2xl font-semibold text-slate-900">Iniciar sesión</h1>
    <p class="mt-1 text-sm text-slate-500">
      Accede al panel administrativo de TextilClean.
    </p>

    @if (error()) {
      <p-message severity="error" styleClass="mt-4 w-full">
        {{ error() }}
      </p-message>
    }

    <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4">
      <div>
        <label for="identifier" class="mb-1 block text-sm font-medium text-slate-700">
          Usuario o email
        </label>
        <input
          id="identifier"
          pInputText
          formControlName="identifier"
          autocomplete="username"
          class="w-full"
        />
        @if (form.controls.identifier.touched && form.controls.identifier.invalid) {
          <p class="mt-1 text-xs text-red-600">El usuario es obligatorio.</p>
        }
      </div>

      <div>
        <label for="password" class="mb-1 block text-sm font-medium text-slate-700">
          Contraseña
        </label>
        <p-password
          inputId="password"
          formControlName="password"
          [feedback]="false"
          [toggleMask]="true"
          [fluid]="true"
        />
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <p class="mt-1 text-xs text-red-600">La contraseña es obligatoria.</p>
        }
      </div>

      <button pButton type="submit" [loading]="loading()" class="w-full">
        <i pButtonIcon class="pi pi-sign-in"></i>
        <span pButtonLabel>Entrar</span>
      </button>
    </form>
  </div>
</main>
EOF
```

### 8.8.4 `login.css` (vacío a propósito)

```bash
cat > src/app/features/auth/login/login.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 8.8.5 `returnUrl`: abrir la URL pedida después del login

Si el usuario entra a `/ventas` sin sesión, `authGuard` (ISS-09) lo manda a `/login?returnUrl=/ventas`. El login lee ese parámetro y navega ahí. La validación `startsWith('/')` evita **open redirects** a dominios externos.

---

## 8.9 Perfil y logout

### 8.9.1 Generar los componentes

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
ng generate component features/auth/profile --skip-tests --defaults
ng generate component features/auth/forbidden --skip-tests --defaults
```

### 8.9.2 `profile.ts`

```bash
cat > src/app/features/auth/profile/profile.ts <<'EOF'
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth';
import { SessionStore } from '../../../core/services/session-store';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

@Component({
  host: { class: 'block' },
  selector: 'app-profile',
  imports: [
    ButtonModule,
    CardModule,
    MessageModule,
    PageHeader,
    TableModule,
    TagModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(MessageService);

  readonly session = inject(SessionStore);
  readonly refreshing = signal(false);

  refresh(): void {
    this.refreshing.set(true);
    this.auth.me().subscribe({
      next: () => {
        this.refreshing.set(false);
        this.notify.add({
          severity: 'success',
          summary: 'Sesión sincronizada',
          detail: 'Perfil y permisos recargados.',
        });
      },
      error: () => this.refreshing.set(false),
    });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.notify.add({ severity: 'info', summary: 'Sesión cerrada' });
        void this.router.navigate(['/login']);
      },
    });
  }
}
EOF
```

### 8.9.3 `profile.html`

```bash
cat > src/app/features/auth/profile/profile.html <<'EOF'
<app-page-header
  title="Mi perfil"
  subtitle="Identidad y permisos efectivos tal como los entrega el backend."
>
  <button pButton type="button" severity="secondary" outlined (click)="refresh()" [loading]="refreshing()">
    <i pButtonIcon class="pi pi-refresh"></i>
    <span pButtonLabel>Actualizar permisos</span>
  </button>
  <button pButton type="button" severity="danger" outlined (click)="logout()">
    <i pButtonIcon class="pi pi-sign-out"></i>
    <span pButtonLabel>Salir</span>
  </button>
</app-page-header>

@if (session.user(); as user) {
  <div class="grid gap-4 lg:grid-cols-3">
    <p-card header="Identidad" styleClass="lg:col-span-1">
      <dl class="space-y-2 text-sm">
        <div class="flex justify-between"><dt class="text-slate-500">Usuario</dt><dd>{{ user.username }}</dd></div>
        <div class="flex justify-between"><dt class="text-slate-500">Email</dt><dd>{{ user.email || '—' }}</dd></div>
        <div class="flex justify-between"><dt class="text-slate-500">Nombre</dt><dd>{{ user.first_name || '—' }}</dd></div>
        <div class="flex justify-between"><dt class="text-slate-500">Estado</dt><dd><p-tag [value]="user.status" severity="secondary" [rounded]="true" /></dd></div>
      </dl>
    </p-card>

    <p-card header="Roles" styleClass="lg:col-span-2">
      <div class="flex flex-wrap gap-2">
        @for (role of session.roleNames(); track role) {
          <p-tag [value]="role" severity="info" [rounded]="true" />
        } @empty {
          <p class="text-sm text-slate-500">Sin roles activos.</p>
        }
      </div>
    </p-card>
  </div>

  <p-card [header]="'Permisos efectivos (' + session.permissionCount() + ')'" styleClass="mt-4">
    <p-table [value]="session.permissions()" dataKey="resource_id" tableStyleClass="min-w-4xl">
      <ng-template #header>
        <tr>
          <th>Método</th>
          <th>Ruta</th>
          <th>Descripción</th>
          <th>Rol</th>
        </tr>
      </ng-template>
      <ng-template #body let-permission>
        <tr>
          <td><p-tag [value]="permission.method" severity="secondary" [rounded]="true" /></td>
          <td class="font-mono text-xs">{{ permission.path }}</td>
          <td class="text-sm text-slate-600">{{ permission.description || '—' }}</td>
          <td><p-tag [value]="permission.role_name" severity="info" [rounded]="true" /></td>
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr><td colspan="4" class="p-4 text-center text-sm text-slate-500">Sin permisos.</td></tr>
      </ng-template>
    </p-table>
  </p-card>
}
EOF
```

### 8.9.4 `profile.css` (vacío a propósito)

```bash
cat > src/app/features/auth/profile/profile.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

> `auth.logout()` limpia la sesión **incluso si el backend falla** (`finalize`). Es deliberado: el usuario debe poder salir aunque el servidor esté caído.

### 8.9.5 `forbidden.ts` (mínimo)

```bash
cat > src/app/features/auth/forbidden/forbidden.ts <<'EOF'
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  host: { class: 'block' },
  selector: 'app-forbidden',
  imports: [ButtonModule, RouterLink],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.css',
})
export class Forbidden {}
EOF

cat > src/app/features/auth/forbidden/forbidden.html <<'EOF'
<main class="flex min-h-screen items-center justify-center bg-slate-100 p-6">
  <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
    <h1 class="text-2xl font-semibold text-slate-900">403 · Acceso denegado</h1>
    <p class="mt-2 text-sm text-slate-500">
      Tu rol no tiene permisos para esta pantalla. Contacta al administrador si crees que es un error.
    </p>
    <button pButton type="button" routerLink="/dashboard" class="mt-4">
      <span pButtonLabel>Ir al panel</span>
    </button>
  </div>
</main>
EOF

cat > src/app/features/auth/forbidden/forbidden.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 8.9.6 Sesiones propias (opcional, no requerido para esta ISS)

El backend expone además `GET /api/sesiones`, `PATCH /api/sesiones/:id/deactivate`, `PATCH /api/sesiones/deactivate-all` y `DELETE /api/sesiones` (**JWT, sin RBAC**). Son útiles para una pantalla **“Mis dispositivos”**; **no** son necesarias para el recorrido principal.

---

## 8.10 Rutas de Fase II

> **Nota del docente.** Esta ISS **no** define todavía `authGuard` ni `guestGuard`: son **ISS-09**. Para que las rutas de esta ISS compilen y funcionen, aquí **no** añadimos `canActivate`; en **ISS-09** los insertas en las rutas correspondientes.

### 8.10.1 Editar `src/app/app.routes.ts`

Añade `/login`, `/perfil` y `/forbidden`. **`/construir` sigue siendo público**.

```bash
cat > src/app/app.routes.ts <<'EOF'
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · TextilClean',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'forbidden',
    title: 'Acceso denegado · TextilClean',
    loadComponent: () =>
      import('./features/auth/forbidden/forbidden').then((m) => m.Forbidden),
  },
  {
    path: 'construir',
    title: 'Prototipo · TextilClean',
    loadComponent: () =>
      import('./features/construir/construir').then((m) => m.Construir),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Panel · TextilClean',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'perfil',
        title: 'Mi perfil · TextilClean',
        loadComponent: () =>
          import('./features/auth/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'clientes',
        title: 'Clientes · TextilClean',
        loadComponent: () =>
          import('./features/clients/client-list/client-list').then(
            (m) => m.ClientList,
          ),
      },
      {
        path: 'tipos-producto',
        title: 'Tipos de producto · TextilClean',
        loadComponent: () =>
          import(
            './features/product-types/product-type-list/product-type-list'
          ).then((m) => m.ProductTypeList),
      },
      {
        path: 'productos',
        title: 'Productos · TextilClean',
        loadComponent: () =>
          import('./features/products/product-list/product-list').then(
            (m) => m.ProductList,
          ),
      },
      {
        path: 'ventas',
        title: 'Ventas · TextilClean',
        loadComponent: () =>
          import('./features/sales/sale-list/sale-list').then(
            (m) => m.SaleList,
          ),
      },
      {
        path: 'ventas/nueva',
        title: 'Nueva venta · TextilClean',
        loadComponent: () =>
          import('./features/sales/sale-form/sale-form').then(
            (m) => m.SaleForm,
          ),
      },
      {
        path: 'detalle-ventas',
        title: 'Detalle de ventas · TextilClean',
        loadComponent: () =>
          import(
            './features/product-sales/product-sale-list/product-sale-list'
          ).then((m) => m.ProductSaleList),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
EOF
```

### 8.10.2 Añadir `/perfil` al menú (`shell.ts`)

```bash
cat > src/app/layout/shell/shell.ts <<'EOF'
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { Aside } from '../aside/aside';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';

@Component({
  host: { class: 'block' },
  selector: 'app-shell',
  imports: [Aside, DrawerModule, Footer, Header, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  readonly mobileOpen = signal(false);

  readonly items: MenuItem[] = [
    { label: 'Panel', icon: 'pi pi-chart-line', routerLink: '/dashboard' },
    { label: 'Clientes', icon: 'pi pi-users', routerLink: '/clientes' },
    { label: 'Tipos de producto', icon: 'pi pi-tags', routerLink: '/tipos-producto' },
    { label: 'Productos', icon: 'pi pi-box', routerLink: '/productos' },
    { label: 'Ventas', icon: 'pi pi-shopping-cart', routerLink: '/ventas' },
    { label: 'Detalle de ventas', icon: 'pi pi-list', routerLink: '/detalle-ventas' },
    { label: 'Mi perfil', icon: 'pi pi-user', routerLink: '/perfil' },
    { label: 'Prototipo', icon: 'pi pi-desktop', routerLink: '/construir' },
  ];

  protected onMenuToggle(): void {
    this.mobileOpen.update((v) => !v);
  }
}
EOF
```

> En **ISS-09** el menú se filtra por permisos (`NAV` + `computed()`), y las rutas de negocio reciben `authGuard` y `permissionGuard`. **Aquí todavía no**.

---

## Conectar sesión al layout existente

`Shell` debe pasar los datos de la sesión a `Header` y `Aside`:

- **`Header`**: `username`, `initials`, `roleLabel`, `userItems` y `[showSession]="true"`.
- **`Aside`**: `[items]="items"`, `[showSession]="true"`, `[username]`, `[roleLabel]`, `[permissionCount]`.
- **`Header`** emite `menuRequested` → `Shell` abre el `Drawer`.
- **`Aside`** emite `logoutRequested` → `Shell` ejecuta `AuthService.logout()` y navega a `/login`.

Actualiza `shell.ts` para inyectar `SessionStore` y `AuthService`:

```bash
cat >> src/app/layout/shell/shell.ts <<'EOF'

// Añadir al imports y a la clase Shell en la siguiente pasada de ISS-09.
EOF
```

> En el proyecto consolidado esta conexión se completa en **ISS-09**, junto con el menú filtrado por permisos. El texto del material lo indica: **“El menú lateral completo y filtrado por RBAC se implementa en ISS-09”**.

---

## Verificación del ISS

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026

# 1. Modelos de sesión
grep -n "SessionTokens\|EffectivePermission\|AccessPayload" src/app/core/models/auth.model.ts

# 2. SessionStore persiste permisos (no roles ni resources)
grep -n "permissions: this._permissions()" src/app/core/services/session-store.ts

# 3. AuthService encadena forkJoin(perfil, permisos)
grep -n "forkJoin(\|this.me()\|setAccess" src/app/core/services/auth.ts

# 4. Interceptor single-flight
grep -n "refreshInFlight ??=\|shareReplay\|finalize" src/app/core/interceptors/auth-interceptor.ts

# 5. Login lee returnUrl y valida startsWith
grep -n "returnUrl\|startsWith('/')" src/app/features/auth/login/login.ts

# 6. Rutas de Fase II
grep -n "login\|forbidden\|perfil" src/app/app.routes.ts

# 7. Interceptores registrados
grep -n "withInterceptors\|authInterceptor\|errorInterceptor" src/app/app.config.ts

# 8. RequireAuth activado
grep -n "requireAuth" src/environments/environment.development.ts src/environments/environment.ts

# 9. Pruebas y build
npm test -- --watch=false
ng build
```

### Comprobación funcional

Con **backend** en `AUTH_ENABLED=true` y **frontend** en `requireAuth: true`:

```bash
npm start
```

| Comprobación | Resultado esperado |
|---|---|
| `/dashboard` **sin** sesión | Redirige a `/login?returnUrl=/dashboard` *(cuando ISS-09 añada `authGuard`)* |
| Login con `admin / Admin123!` | Guarda tokens, carga perfil + permisos y navega a `/dashboard` |
| DevTools → Application → Local Storage | Contiene `textilclean.session.v1` con `accessToken`, `refreshToken`, `user`, `permissions` |
| Cualquier request protegida | Cabecera `Authorization: Bearer <access>` presente |
| Forzar expiración del access (DevTools) | `GET /api/clientes → 401 → POST /api/sesion/refresh → 200 → GET /api/clientes → 200` |
| Dos peticiones simultáneas con access vencido | **Un solo** `POST /api/sesion/refresh` y **dos** reintentos |
| Logout en `/perfil` | Borra el storage y navega a `/login`. El refresh deja de servir |
| `/construir` **sin** sesión | Abre **sin** peticiones a `/perfil`, `/permisos` ni `/refresh` |

### Comprobación del refresh, reuse detection y logout (contra el backend)

```bash
BASE=http://localhost:4000

# 1. Login y extrae el refresh
LOGIN=$(curl -s -X POST $BASE/api/sesion/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin123!"}')
REFRESH=$(echo "$LOGIN" | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)

# 2. Primer refresh: rota
curl -s -X POST $BASE/api/sesion/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH\"}"

# 3. Reusar el viejo: 401 y familia revocada
curl -i -X POST $BASE/api/sesion/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH\"}"

# 4. Logout revoca el refresh presentado (idempotente)
curl -s -X POST $BASE/api/sesion/logout \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH\"}"
```

El frontend, ante el `401` de **reuse**, limpia la sesión y **redirige al login**.

---

## Correspondencia con el código

Archivos que **crea o reemplaza** este ISS:

- `src/app/core/models/auth.model.ts` *(nuevo)*
- `src/app/core/models/user.model.ts` *(si no existía)*
- `src/app/core/models/role.model.ts` *(si no existía)*
- `src/app/core/models/resource.model.ts` *(si no existía)*
- `src/app/core/interceptors/auth-interceptor.ts` *(reemplaza el passthrough del CLI)*
- `src/app/core/interceptors/error-interceptor.ts` *(reemplaza el passthrough del CLI)*
- `src/app/core/services/session-store.ts` *(nuevo)*
- `src/app/core/services/auth.ts` *(nuevo)*
- `src/app/features/auth/login/login.ts` *(reemplaza)*
- `src/app/features/auth/login/login.html` *(reemplaza)*
- `src/app/features/auth/login/login.css` *(reemplaza)*
- `src/app/features/auth/profile/profile.ts` *(reemplaza)*
- `src/app/features/auth/profile/profile.html` *(reemplaza)*
- `src/app/features/auth/profile/profile.css` *(reemplaza)*
- `src/app/features/auth/forbidden/forbidden.ts` *(reemplaza)*
- `src/app/features/auth/forbidden/forbidden.html` *(reemplaza)*
- `src/app/features/auth/forbidden/forbidden.css` *(reemplaza)*
- `src/app/app.config.ts` *(edita: añade `provideHttpClient` con interceptores)*
- `src/app/app.routes.ts` *(edita: añade `/login`, `/forbidden`, `/perfil`; `/construir` sigue público)*
- `src/app/layout/shell/shell.ts` *(edita: añade "Mi perfil" al menú)*
- `src/environments/environment.development.ts` *(edita: `requireAuth: true`)*
- `src/environments/environment.ts` *(edita: `requireAuth: true`)*

Archivos de **ISS-02 → ISS-07 que no se tocan**: `filter-rows.ts`, `api-error.ts`, `notification.ts`, `to-number.ts`, `status-tag`, `page-header`, `empty-state`, `features/clients/`, `features/product-types/`, `features/products/`, `features/sales/`, `features/product-sales/`, `features/dashboard/`.

---

## Notas del docente

- **Login NO devuelve `user` ni `roles` ni `resources`.** El frontend encadena `forkJoin(perfil, permisos)` **después** de guardar tokens. `switchMap` hace que `login()` no emita hasta que `me()` responda.
- **`localStorage` es deliberado** para que el laboratorio sea observable en DevTools. En producción: cookies `HttpOnly + Secure + SameSite`.
- **Single-flight refresh**: usa **una variable de módulo** (`refreshInFlight`) y `??=`, **no `=`**. Con `=` lanzas un refresh por cada 401 concurrente. Si ves **dos** refresh, el single-flight está roto.
- **`logout` limpia la sesión incluso si el backend falla** (`finalize`). Es correcto: el usuario debe poder salir aunque el servidor esté caído.
- **`/construir` es público** y **no** invoca perfil, permisos ni refresh. Es la prueba de la evidencia de aprendizaje.
- **`guestGuard` y `authGuard`** se implementan en **ISS-09**. En esta ISS **no** se añaden `canActivate` a las rutas.
- **`error-interceptor` complementa** a `authInterceptor`: el primero **traduce** 403/500/offline a toasts; el segundo **añade** `Bearer` y **reintenta** 401. No dupliques mensajes: el componente puede seguir manejando el error con `p-message` si lo necesita.

---

## Navegación

⬅️ **Anterior:** ISS-07 — Detalle de ventas, dashboard y cierre de Fase I
⬆️ **Ruta:** Frontend-Express · **Fase II · Bloque 1 de 3 (sesión)**
➡️ **Siguiente:** ISS-09 — Guards y RBAC estructural en la UI