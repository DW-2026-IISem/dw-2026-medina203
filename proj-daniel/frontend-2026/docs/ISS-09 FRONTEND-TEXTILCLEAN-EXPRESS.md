# 🛠 ISS-09 · Guards y RBAC estructural en la UI

> **Proyecto frontend:** `front-textilclean-express` (carpeta real: `frontend-2026`)
> **Ruta frontend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026`
> **Proyecto backend:** `app-textilclean-express`
> **Ruta backend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express`
> **Fase:** II · Auth + RBAC · Bloque **2 de 3** (protección) · **Bloqueado por:** ISS-08 · **Habilita:** ISS-10
> **Vigencia:** revisión alineada con guía del docente del 23-oct-2026.
> **Capa:** 🛠 Construir (ejecutar, verificar y entregar)

---

## 0. Antes de tocar nada

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
pwd
```

Verifica que **ISS-08** está cerrada:

```bash
ls src/app/core/services/         # auth.ts  session-store.ts
ls src/app/core/interceptors/     # auth-interceptor.ts  error-interceptor.ts
ls src/app/features/auth/         # login/  profile/  forbidden/
ls src/app/layout/shell/          # shell.ts  shell.html
ls src/app/core/models/           # auth  user  role  resource  ...
```

Si falta algo, **detente** y vuelve a **ISS-08**.

---

## Objetivo y alcance

Convertir la **autenticación** en **autorización visible**:

> **Fase II · bloque 2 de 3 — Protección del Business.** Esta ISS **no reescribe** las pantallas de Fase I (clientes, tipos, productos, ventas, detalle). Solo añade `canActivate`/`data` a sus rutas, envuelve sus botones con `*appHasPermission` y **filtra el menú**. Los formularios de **administración RBAC** llegan en **ISS-10**.

Entregables:

1. **`authGuard`**: sin sesión → `/login`.
2. **`guestGuard`**: con sesión → **no** volver al login.
3. **`permissionGuard`**: sin la concesión de la ruta → `/forbidden`.
4. **`*appHasPermission`**: oculta botones de escritura.
5. **Menú lateral** calculado con `computed()` según `SessionStore`.

> **Principio clave.** Todo esto es **UX, no seguridad**. El backend vuelve a validar con `authenticate + authorize`. Un usuario puede forzar la URL o el DOM; el backend responde `401/403` y el `errorInterceptor` muestra el toast.

> **Fuente de verdad en el cliente:** `SessionStore.permissions()`, cargada desde `GET /api/permisos`. **No** hay permisos hardcodeados por rol.

> **Modo laboratorio.** `authGuard`, `guestGuard` y `permissionGuard` consultan `environment.requireAuth`; con `false` **dejan pasar**. `authOnlyGuard` consulta `SessionStore.authEnabled` (su copia) y **hace lo contrario**: cierra `/perfil` y `/admin/*`. Solo tiene sentido junto con `AUTH_ENABLED=false` en el `.env` del backend, que abre las 5 rutas de negocio. Con las banderas desemparejadas la UI no se bloquea pero la API responde `401` (ISS-11 §11.1).

**Antes de construir:** comprueba `authGuard` → `permissionGuard` → menú filtrado → botones. `NAV` y `computed` permanecen en `Shell`; `Aside` **solo presenta** `items`.

**Evidencia de aprendizaje:** prueba URL directa, menú y acción con **dos usuarios**; documenta `401` y `403` sin confundirlos.

**Equipo y terminal:** Ubuntu WSL, terminal del editor, carpeta `frontend-2026`.

---

## Criterios de aceptación (ISS-09)

- [ ] **Sin sesión**, cualquier ruta protegida redirige a `/login` con `returnUrl`.
- [ ] **Con sesión**, `/login` redirige al dashboard (`guestGuard`).
- [ ] **`admin`** (todos los permisos) ve todo el menú de negocio; el bloque **Seguridad** se añade con ISS-10.
- [ ] **`seller`** ve solo Panel, Clientes, Productos y Ventas; **no ve** Tipos de producto ni Detalle de ventas.
- [ ] Escribir a mano `/tipos-producto` con `seller` lleva a `/forbidden` y muestra el permiso faltante (`GET /api/tipos-producto`).
- [ ] Los **botones de escritura** desaparecen si falta el `POST/PATCH/DELETE`.
- [ ] Tras “Actualizar permisos”, el **menú y los botones cambian sin recargar**.
- [ ] Las cinco pantallas de Fase I siguen funcionando **sin cambios de lógica**: `admin` las usa igual que antes y `seller` las ve en modo lectura donde corresponde.
- [ ] **No hay botones que el backend vaya a rechazar**: ventas y detalle solo muestran las operaciones que concede `resource-catalog.ts`.
- [ ] `ng serve` compila sin errores.
- [ ] Con `requireAuth: false` (modo laboratorio) el grupo **Seguridad no aparece** y `/perfil` o `/admin/*` por URL redirigen a `/dashboard` (`authOnlyGuard`).

---

## 9.0 Generar guards y directiva

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
ng generate guard core/guards/auth --functional --implements=CanActivate --skip-tests --defaults
ng generate guard core/guards/guest --functional --implements=CanActivate --skip-tests --defaults
ng generate guard core/guards/permission --functional --implements=CanActivate --skip-tests --defaults
ng generate directive shared/directives/has-permission --skip-tests --defaults
```

> El separador de `guard` genera `auth-guard.ts`, `guest-guard.ts` y `permission-guard.ts`, que coinciden con sus imports. **Si los creaste al conectar las rutas de ISS-08**, completa sus cuerpos **sin volver a generarlos**. La directiva se genera **antes** de añadir sus imports a los componentes.

Comprueba:

```bash
ls src/app/core/guards/          # auth-guard.ts  guest-guard.ts  permission-guard.ts
ls src/app/shared/directives/    # has-permission.ts
```

---

## 9.1 `authGuard`

```bash
mkdir -p src/app/core/guards
cat > src/app/core/guards/auth-guard.ts <<'EOF'
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionStore } from '../services/session-store';

/** ¿Quién eres? Si no hay access token, a /login con returnUrl. */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  if (!environment.requireAuth || session.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
EOF
```

> `createUrlTree` es **preferible** a `router.navigate` dentro de un guard: el `Router` evalúa la redirección **antes** de activar el componente, sin parpadeos.

---

## 9.2 `guestGuard`

```bash
cat > src/app/core/guards/guest-guard.ts <<'EOF'
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionStore } from '../services/session-store';

/** Un usuario ya autenticado no necesita volver a /login. */
export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);

  if (!environment.requireAuth || !session.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
EOF
```

---

## 9.3 `permissionGuard`

```bash
cat > src/app/core/guards/permission-guard.ts <<'EOF'
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionStore } from '../services/session-store';

/**
 * ¿Qué puedes hacer? Se declara en la ruta:
 *   data: { permission: 'GET /api/clientes' }
 * Es una ayuda visual; Express vuelve a validar con Auth.authorize.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  if (!environment.requireAuth) {
    return true;
  }

  const permission = route.data?.['permission'] as string | undefined;
  if (!permission || session.canPermission(permission)) {
    return true;
  }

  return router.createUrlTree(['/forbidden'], {
    queryParams: { permission },
  });
};
EOF
```

### Cómo se evalúa `canPermission`

`canPermission('GET /api/clientes/7')`:

1. Separa verbo (`GET`) y ruta (`/api/clientes/7`).
2. Recorre `permissions()` (cada fila trae `method` y `path` **patrón**).
3. Casa `/api/clientes/:id` con `/api/clientes/7` mediante **regex anclada**.
4. **Deny by default:** si ninguna fila coincide, devuelve `false`.

---

## 9.3A `authOnlyGuard` (pantallas que no existen en Fase I)

La **administración RBAC** y el **perfil** no tienen sentido sin sesión: el backend los mantiene con JWT aunque el frontend esté en modo laboratorio. Este guard **evita ofrecer pantallas que responderían `401`**.

```bash
cat > src/app/core/guards/auth-only-guard.ts <<'EOF'
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../services/session-store';

/**
 * Pantallas que requieren auth real (perfil, /admin/*).
 * En modo laboratorio (authEnabled = false) se redirige al dashboard.
 */
export const authOnlyGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);

  if (session.authEnabled) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
EOF
```

> Se aplica **antes** de `permissionGuard` en `/perfil` y en las cinco rutas `/admin/*` (que se declaran en **ISS-10**).

### Ejemplo (para cuando llegue ISS-10)

```ts
{
  path: 'admin/usuarios',
  canActivate: [authOnlyGuard, permissionGuard],
  data: { permission: 'GET /api/usuarios' },
  loadComponent: () =>
    import('./features/admin/users/user-list/user-list').then(
      (m) => m.UserList,
    ),
},
```

El `Shell` usa **la misma condición** para no pintar el grupo **Seguridad** del menú (`authOnly: true` en `NAV`). Así el **modo laboratorio se ve como la Fase I real**: Operación + Prototipo.

> `authOnlyGuard` lee `SessionStore.authEnabled`, que es la copia de `environment.requireAuth` que ya consume el `Shell`. Los otros guards leen el `environment` **directamente**; ambas fuentes valen lo mismo.

---

## 9.4 Matriz de rutas de Fase II

Encima de cada `loadComponent` de las rutas ya existentes (las de Fase I), añade `canActivate` y `data`:

| Ruta | Permiso |
|---|---|
| `/clientes` | `GET /api/clientes` |
| `/tipos-producto` | `GET /api/tipos-producto` |
| `/productos` | `GET /api/productos` |
| `/ventas` | `GET /api/ventas` |
| `/ventas/nueva` | `POST /api/ventas` |
| `/detalle-ventas` | `GET /api/detalle-ventas` |
| `/dashboard` | `GET /api/ventas` |

> Las rutas `/admin/*` **no se declaran aquí**: sus componentes se crean en **ISS-10**.
>
> Las rutas `/perfil` y `/forbidden` **no llevan** `permissionGuard`: **todo usuario autenticado** debe poder ver su sesión y la pantalla de acceso denegado.

### Ejemplo completo (ruta de clientes desde ISS-03)

```ts
{
  path: 'clientes',
  title: 'Clientes · TextilClean',
  canActivate: [permissionGuard],
  data: { permission: 'GET /api/clientes' },
  loadComponent: () =>
    import('./features/clients/client-list/client-list').then(
      (m) => m.ClientList,
    ),
},
```

---

## 9.5 Directiva `*appHasPermission`

Se conserva como **ampliación** en ISS-02; créala ahora si seguiste el recorrido básico. Su fuente es `SessionStore.canPermission()`.

```bash
cat > src/app/shared/directives/has-permission.ts <<'EOF'
import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { SessionStore } from '../../core/services/session-store';

/**
 * Directiva estructural: muestra el contenido si el usuario tiene el permiso.
 *
 * Uso:
 *   <ng-container *appHasPermission="'POST /api/clientes'">…</ng-container>
 *
 * Es UX, no seguridad: el backend vuelve a validar cada petición.
 */
@Directive({
  selector: '[appHasPermission]',
})
export class HasPermission {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly session = inject(SessionStore);

  readonly appHasPermission = input.required<string>();

  constructor() {
    effect(() => {
      const permission = this.appHasPermission();
      const allowed = this.session.canPermission(permission);

      if (allowed) {
        if (!this.viewContainer.length) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        }
      } else {
        this.viewContainer.clear();
      }
    });
  }
}
EOF
```

### Diferencia con `@if`

| `@if` | `*appHasPermission` |
|---|---|
| Evalúa una condición cualquiera | Evalúa un **permiso RBAC** |
| Reacciona si la expresión lee signals de sesión | `effect()` reacciona a `permissions()` |
| El template queda en el DOM compilado | Crea/destruye la vista embebida |

### Permisos exactos por acción (pantallas de Fase I)

```html
<ng-container *appHasPermission="'PATCH /api/clientes/:id'">…</ng-container>
<ng-container *appHasPermission="'DELETE /api/clientes/:id'">…</ng-container>
```

**Business**: estas son las operaciones que el **catálogo del backend** (`src/features/auth/resources/resource-catalog.ts`) **sí concede**, y por tanto las únicas que la UI puede ofrecer:

| Pantalla | Crear | Editar | Baja lógica | Baja física |
|---|---|---|---|---|
| **Clientes** | `POST /api/clientes` | `PATCH /api/clientes/:id` | `PATCH /api/clientes/:id/deactivate` | `DELETE /api/clientes/:id` |
| **Tipos de producto** | `POST /api/tipos-producto` | `PATCH /api/tipos-producto/:id` | `PATCH /api/tipos-producto/:id/deactivate` | `DELETE /api/tipos-producto/:id` |
| **Productos** | `POST /api/productos` | `PATCH /api/productos/:id` | `PATCH /api/productos/:id/deactivate` | `DELETE /api/productos/:id` |
| **Ventas** | `POST /api/ventas` | — | — | — |
| **Detalle de ventas** | — | — | — | — |

### Ventas y detalle: límite real del backend

El **catálogo RBAC** concede:

- **Ventas:** solo `GET /api/ventas`, `GET /api/ventas/:id` y `POST /api/ventas`.
- **Detalle:** solo `GET /api/detalle-ventas`.

Aunque las rutas Express acepten `PATCH`, `DELETE` y `/:id/deactivate`, **no existen recursos para concederlas**, así que `authorize` respondería `403` incluso a `ADMIN`.

> **Consecuencia para la UI en Fase II:**
>
> - **Ventas:** se conserva **listar y registrar**; **no** se muestran editar, cancelar ni eliminar. Cancelar una venta **no es una operación expuesta** por el modelo RBAC.
> - **Detalle:** solo `GET /api/detalle-ventas`; las acciones de escritura de **ISS-07** se **ocultan**. El detalle se administra **creando la venta completa** (`POST /api/ventas`) y se consulta con `GET /api/ventas/:id`.
>
> En Fase I, contra un backend sin middlewares, esas acciones **funcionan**: por eso **no se borran del código, se ocultan por permiso**. Si el curso necesita CRUD de ventas en Fase II, **primero** hay que ampliar `resource-catalog.ts` en el backend.

### Checklist de protección de las pantallas Business

| Ruta | `canActivate` + `data.permission` | Botones a envolver |
|---|---|---|
| `/clientes` | `permissionGuard` · `GET /api/clientes` | crear, editar, baja lógica, eliminar |
| `/tipos-producto` | `permissionGuard` · `GET /api/tipos-producto` | crear, editar, baja lógica, eliminar |
| `/productos` | `permissionGuard` · `GET /api/productos` | crear, editar, baja lógica, eliminar |
| `/ventas` | `permissionGuard` · `GET /api/ventas` | nueva venta (`POST /api/ventas`) |
| `/ventas/nueva` | `permissionGuard` · `POST /api/ventas` | guardar venta |
| `/detalle-ventas` | `permissionGuard` · `GET /api/detalle-ventas` | **ninguno** (solo lectura) |
| `/dashboard` | `permissionGuard` · `GET /api/ventas` | ninguna acción; solo lectura agregada |

> El **dashboard** no inventa permisos. **No** existe `GET /api/dashboard`: sus datos salen de las listas de negocio. Se protege con el **permiso más débil** que necesita (`GET /api/ventas`); si un usuario no puede leer una fuente, esa tarjeta se **oculta** con `*appHasPermission` en vez de romper la pantalla.

---

## 9.6 Menú lateral con `computed`

### 9.6.1 Catálogo `NAV`

```bash
mkdir -p src/app/layout/shell
cat > src/app/layout/shell/nav.config.ts <<'EOF'
export interface NavItem {
  label: string;
  icon: string;
  routerLink: string;
  permission?: string;
}

export interface NavGroup {
  label: string;
  authOnly?: boolean;
  items: NavItem[];
}

/**
 * Catálogo estático de rutas. La visibilidad de cada item se decide en
 * `Shell.navGroups()` a partir de `SessionStore.canPermission()`.
 */
export const NAV: NavGroup[] = [
  {
    label: 'Operación',
    items: [
      {
        label: 'Panel',
        icon: 'pi pi-chart-line',
        routerLink: '/dashboard',
        permission: 'GET /api/ventas',
      },
      {
        label: 'Clientes',
        icon: 'pi pi-users',
        routerLink: '/clientes',
        permission: 'GET /api/clientes',
      },
      {
        label: 'Tipos de producto',
        icon: 'pi pi-tags',
        routerLink: '/tipos-producto',
        permission: 'GET /api/tipos-producto',
      },
      {
        label: 'Productos',
        icon: 'pi pi-box',
        routerLink: '/productos',
        permission: 'GET /api/productos',
      },
      {
        label: 'Ventas',
        icon: 'pi pi-shopping-cart',
        routerLink: '/ventas',
        permission: 'GET /api/ventas',
      },
      {
        label: 'Detalle de ventas',
        icon: 'pi pi-list',
        routerLink: '/detalle-ventas',
        permission: 'GET /api/detalle-ventas',
      },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      {
        label: 'Mi perfil',
        icon: 'pi pi-user',
        routerLink: '/perfil',
      },
    ],
  },
  {
    label: 'Seguridad',
    authOnly: true,
    items: [
      // Los items /admin/* se añaden en ISS-10 con sus permisos.
    ],
  },
];
EOF
```

### 9.6.2 `Shell` con `navGroups` calculado

```bash
cat > src/app/layout/shell/shell.ts <<'EOF'
import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Aside } from '../aside/aside';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import { SessionStore } from '../../core/services/session-store';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { NAV } from './nav.config';

@Component({
  host: { class: 'block' },
  selector: 'app-shell',
  imports: [
    Aside,
    ConfirmDialogModule,
    DrawerModule,
    Footer,
    Header,
    RouterOutlet,
    ToastModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly session = inject(SessionStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly mobileOpen = signal(false);

  readonly navGroups = computed<MenuItem[]>(() =>
    NAV
      .filter((group) => !group.authOnly || this.session.authEnabled)
      .map((group) => ({
        label: group.label,
        items: group.items
          .filter(
            (item) =>
              !item.permission ||
              this.session.canPermission(item.permission),
          )
          .map<MenuItem>((item) => ({
            label: item.label,
            icon: item.icon,
            routerLink: item.routerLink,
            routerLinkActiveOptions: {
              exact: item.routerLink === '/ventas',
            },
          })),
      }))
      .filter((group) => (group.items?.length ?? 0) > 0),
  );

  readonly roleLabel = computed(() =>
    this.session.roleNames().join(', ') || 'Sin rol',
  );

  readonly initials = computed(() => {
    const user = this.session.user();
    if (!user) return 'IN';
    const first = (user.first_name ?? user.username).charAt(0).toUpperCase();
    const last = (user.last_name ?? '').charAt(0).toUpperCase();
    return (first + last).slice(0, 2) || 'IN';
  });

  protected onMenuToggle(): void {
    this.mobileOpen.update((v) => !v);
  }

  protected onLogout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
    });
  }
}
EOF
```

> `computed` se recalcula cuando cambia `permissions()`. Después de `AuthService.me()`, el menú se **ajusta sin recargar la página**.

### 9.6.3 `shell.html` (esqueleto)

```bash
cat > src/app/layout/shell/shell.html <<'EOF'
<div class="flex min-h-screen flex-col bg-slate-100">
  <app-header
    [showSession]="true"
    [username]="session.user()?.username ?? ''"
    [initials]="initials()"
    [roleLabel]="roleLabel()"
    (menuRequested)="onMenuToggle()"
  />

  <div class="flex flex-1">
    <aside class="hidden w-72 shrink-0 lg:block">
      <app-aside
        [items]="navGroups()"
        [showSession]="true"
        [username]="session.user()?.username ?? ''"
        [roleLabel]="roleLabel()"
        [permissionCount]="session.permissionCount()"
        (logoutRequested)="onLogout()"
      />
    </aside>

    <main id="contenido" class="min-w-0 flex-1 p-4 sm:p-6">
      <router-outlet />
    </main>
  </div>

  <app-footer />
</div>

<p-drawer [(visible)]="mobileOpen" header="Menú" position="left" styleClass="w-72">
  <app-aside
    [items]="navGroups()"
    [showSession]="true"
    [username]="session.user()?.username ?? ''"
    [roleLabel]="roleLabel()"
    [permissionCount]="session.permissionCount()"
    (logoutRequested)="onLogout()"
  />
</p-drawer>

<p-toast />
<p-confirmdialog />
EOF
```

> **Ajusta `aside.ts` y `header.ts`** si aún no tenían los `input()` para `showSession`, `username`, `roleLabel`, `permissionCount`, ni los `output()` `logoutRequested` / `menuRequested`. En ISS-01B y ISS-08 ya los declaramos; si tu copia no los tiene, añádelos ahora sin cambiar su lógica.

### 9.6.4 Topbar y menú de usuario

- **Avatar** con iniciales (`computed` → `initials()`).
- **Tag** con roles (`roleLabel`, derivado de `roleNames()`).
- **Menú popup**: Mi sesión, Actualizar permisos, Cerrar sesión.
- **`p-toast`** y **`p-confirmdialog`** globales en el `Shell`.

> **Error clásico:** `<p-menu #userMenu [model]="userMenu()">` hace que la **referencia de plantilla** `#userMenu` **tape** el método `userMenu()` y Angular reporte `Type 'Menu' has no call signatures`. **Usa `#userMenuPanel`.**

---

## 9.7 `/forbidden`: explicar el 403

```bash
cat > src/app/features/auth/forbidden/forbidden.ts <<'EOF'
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  host: { class: 'block' },
  selector: 'app-forbidden',
  imports: [ButtonModule, RouterLink],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.css',
})
export class Forbidden {
  private readonly route = inject(ActivatedRoute);
  readonly permission =
    this.route.snapshot.queryParamMap.get('permission');
}
EOF

cat > src/app/features/auth/forbidden/forbidden.html <<'EOF'
<main class="flex min-h-screen items-center justify-center bg-slate-100 p-6">
  <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
    <h1 class="text-2xl font-semibold text-slate-900">403 · Acceso denegado</h1>
    <p class="mt-2 text-sm text-slate-500">
      Tu rol no tiene permisos para esta pantalla. Pide a un administrador que
      conceda el permiso faltante.
    </p>

    @if (permission) {
      <div class="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-left">
        <p class="text-[11px] uppercase text-slate-400">Permiso requerido</p>
        <code class="text-sm text-emerald-300">{{ permission }}</code>
      </div>
    }

    <button pButton type="button" routerLink="/dashboard" class="mt-6">
      <span pButtonLabel>Ir al panel</span>
    </button>
  </div>
</main>
EOF

cat > src/app/features/auth/forbidden/forbidden.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

> Esto convierte un **“no puedo entrar”** en una **pista accionable**: pide a un admin que cree la fila en `resource_roles` (pantalla `/admin/permisos`, ISS-10).

---

## 9.8 Envolver los botones de las pantallas Business

Aplica **`*appHasPermission`** a los botones de cada pantalla. Los archivos `client-list.ts`, `product-type-list.ts`, `product-list.ts`, `sale-list.ts` y `product-sale-list.ts` **no cambian su lógica**: solo se envuelven los botones en sus `.html`.

Añade la directiva al `imports` del componente e envuelve los botones.

### 9.8.1 `client-list.html`

```html
<!-- En el import del componente: HasPermission. En el HTML: -->
<ng-container *appHasPermission="'POST /api/clientes'">
  <button pButton type="button" (click)="openCreate()">
    <i pButtonIcon class="pi pi-plus"></i>
    <span pButtonLabel>Nuevo cliente</span>
  </button>
</ng-container>

<!-- En la columna de acciones de la fila: -->
<ng-container *appHasPermission="'PATCH /api/clientes/:id'">
  <button pButton ... icon="pi pi-pencil" (click)="openEdit(client)"></button>
</ng-container>
<ng-container *appHasPermission="'PATCH /api/clientes/:id/deactivate'">
  <button pButton ... icon="pi pi-ban" (click)="deactivate(client)"></button>
</ng-container>
<ng-container *appHasPermission="'DELETE /api/clientes/:id'">
  <button pButton ... icon="pi pi-trash" (click)="remove(client)"></button>
</ng-container>
```

**Añade `HasPermission` al `imports`** de `client-list.ts`.

### 9.8.2 `product-type-list.html` — mismos 4 permisos, con `/api/tipos-producto`

### 9.8.3 `product-list.html` — mismos 4 permisos, con `/api/productos`

### 9.8.4 `sale-list.html`

- Envuelve **“Nueva venta”** con `*appHasPermission="'POST /api/ventas'"`.
- **Envuelve** los botones de **cancelar** (`PATCH /api/ventas/:id/deactivate`) y **eliminar** (`DELETE /api/ventas/:id`) con `*appHasPermission`, **sabiendo que con el catálogo actual no aparecerán para ningún rol** (documentado en 9.5). En Fase I, contra un backend sin middlewares, sí funcionan; en Fase II quedan ocultos porque no hay concesión que los cubra.

### 9.8.5 `product-sale-list.html`

Envuelve **todas** las acciones de escritura (crear, editar, baja lógica, eliminar) con sus permisos. Con el catálogo actual **quedarán todas ocultas** (documentado en 9.5).

### 9.8.6 `dashboard.html`

Envuelve las tarjetas o tablas que dependan de una fuente que el usuario **no** puede leer. Por ejemplo, si un rol no tiene `GET /api/tipos-producto`, oculta la tarjeta “Tipos”:

```html
<ng-container *appHasPermission="'GET /api/tipos-producto'">
  <p-card>
    <p class="text-xs uppercase tracking-wider text-slate-500">Tipos</p>
    <p class="mt-1 text-3xl font-semibold">{{ types().length }}</p>
  </p-card>
</ng-container>
```

> **No** inventes permisos que el backend no concede. Cuando un botón lleve a un `403` previsible, **ocúltalo**.

---

## 9.9 Rutas finales de Fase II

```bash
cat > src/app/app.routes.ts <<'EOF'
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { authOnlyGuard } from './core/guards/auth-only-guard';
import { guestGuard } from './core/guards/guest-guard';
import { permissionGuard } from './core/guards/permission-guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · TextilClean',
    canActivate: [guestGuard],
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Panel · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/ventas' },
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'perfil',
        title: 'Mi perfil · TextilClean',
        canActivate: [authOnlyGuard],
        loadComponent: () =>
          import('./features/auth/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'clientes',
        title: 'Clientes · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/clientes' },
        loadComponent: () =>
          import('./features/clients/client-list/client-list').then(
            (m) => m.ClientList,
          ),
      },
      {
        path: 'tipos-producto',
        title: 'Tipos de producto · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/tipos-producto' },
        loadComponent: () =>
          import(
            './features/product-types/product-type-list/product-type-list'
          ).then((m) => m.ProductTypeList),
      },
      {
        path: 'productos',
        title: 'Productos · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/productos' },
        loadComponent: () =>
          import('./features/products/product-list/product-list').then(
            (m) => m.ProductList,
          ),
      },
      {
        path: 'ventas',
        title: 'Ventas · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/ventas' },
        loadComponent: () =>
          import('./features/sales/sale-list/sale-list').then(
            (m) => m.SaleList,
          ),
      },
      {
        path: 'ventas/nueva',
        title: 'Nueva venta · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'POST /api/ventas' },
        loadComponent: () =>
          import('./features/sales/sale-form/sale-form').then(
            (m) => m.SaleForm,
          ),
      },
      {
        path: 'detalle-ventas',
        title: 'Detalle de ventas · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/detalle-ventas' },
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

---

## Verificación del ISS

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026

# 1. Guards y directiva existen
ls src/app/core/guards/ src/app/shared/directives/

# 2. Guard principal y permissionGuard
grep -n "requireAuth\|isAuthenticated" src/app/core/guards/auth-guard.ts
grep -n "canPermission\|permission" src/app/core/guards/permission-guard.ts

# 3. authOnlyGuard
grep -n "authEnabled" src/app/core/guards/auth-only-guard.ts

# 4. Directiva: input y effect
grep -n "appHasPermission = input.required" \
  src/app/shared/directives/has-permission.ts
grep -n "effect(" src/app/shared/directives/has-permission.ts

# 5. Rutas con canActivate + data.permission
grep -n "permissionGuard\|data: { permission" src/app/app.routes.ts

# 6. Shell usa navGroups y computed
grep -n "navGroups = computed\|NAV" src/app/layout/shell/shell.ts
grep -n "authOnly\|permission" src/app/layout/shell/nav.config.ts

# 7. Botones envueltos con *appHasPermission
grep -rn "appHasPermission" src/app/features/clients/ \
  src/app/features/product-types/ \
  src/app/features/products/ \
  src/app/features/sales/ \
  src/app/features/product-sales/ \
  src/app/features/dashboard/

# 8. Pruebas y build
npm test -- --watch=false
ng build
```

### Comprobación funcional (solo rutas Business)

Con **backend** en `AUTH_ENABLED=true` y **frontend** en `requireAuth: true`:

```bash
npm start
```

| Comprobación | Resultado esperado |
|---|---|
| **Login admin** | Menú de negocio **completo** |
| **Logout** | Vuelve a `/login` |
| **Login seller** | Menú **reducido**: sin **Tipos de producto** y sin **Detalle de ventas** |
| Seller escribe `/tipos-producto` en la URL | Redirige a `/forbidden` y muestra `GET /api/tipos-producto` |
| Seller en `/clientes` | **No ve** “Nuevo cliente” ni acciones de escritura |
| Seller en `/ventas` | **Sí ve** “Nueva venta” (`POST /api/ventas` es suyo) |
| Seller en `/ventas/:id` (por el botón “ver detalle”) | El detalle se lee pero **no** hay acciones de cancelar/eliminar visibles |
| **Actualizar permisos** (en `/perfil`) | El menú y los botones cambian **sin recargar** |

### Prueba de que el backend manda

Con `seller`, abre DevTools → Console y ejecuta un `fetch` al endpoint prohibido:

```js
fetch('http://localhost:4000/api/usuarios', {
  headers: {
    Authorization:
      'Bearer ' +
      JSON.parse(localStorage.getItem('textilclean.session.v1')).accessToken,
  },
}).then((r) => console.log(r.status));
```

Debe imprimir **`403`**. La UI **no** es la seguridad; el backend **sí**.

### Modo laboratorio

Con `requireAuth: false` (frontend) y `AUTH_ENABLED=false` (backend):

- El grupo **Seguridad** **no aparece** en el menú.
- `/perfil` y `/admin/*` por URL **redirigen a `/dashboard`** (`authOnlyGuard`).
- Las rutas de negocio (`/clientes`, `/productos`, etc.) son accesibles **sin login** porque `authGuard` y `permissionGuard` dejan pasar.

---

## Correspondencia con el código

Archivos que **crea o reemplaza** este ISS:

- `src/app/core/guards/auth-guard.ts` *(nuevo)*
- `src/app/core/guards/guest-guard.ts` *(nuevo)*
- `src/app/core/guards/permission-guard.ts` *(nuevo)*
- `src/app/core/guards/auth-only-guard.ts` *(nuevo)*
- `src/app/shared/directives/has-permission.ts` *(nuevo)*
- `src/app/layout/shell/nav.config.ts` *(nuevo)*
- `src/app/layout/shell/shell.ts` *(reemplaza)*
- `src/app/layout/shell/shell.html` *(reemplaza)*
- `src/app/features/auth/forbidden/forbidden.ts` *(reemplaza)*
- `src/app/features/auth/forbidden/forbidden.html` *(reemplaza)*
- `src/app/features/auth/forbidden/forbidden.css` *(reemplaza)*
- `src/app/app.routes.ts` *(reemplaza: añade `canActivate` y `data.permission` a las rutas de Fase I; `/construir` sigue público)*
- `src/app/features/clients/client-list/client-list.html` *(envuelve botones)*
- `src/app/features/clients/client-list/client-list.ts` *(añade `HasPermission` al `imports`)*
- `src/app/features/product-types/product-type-list/product-type-list.html` *(ídem)*
- `src/app/features/product-types/product-type-list/product-type-list.ts` *(ídem)*
- `src/app/features/products/product-list/product-list.html` *(ídem)*
- `src/app/features/products/product-list/product-list.ts` *(ídem)*
- `src/app/features/sales/sale-list/sale-list.html` *(ídem)*
- `src/app/features/sales/sale-list/sale-list.ts` *(ídem)*
- `src/app/features/product-sales/product-sale-list/product-sale-list.html` *(ídem)*
- `src/app/features/product-sales/product-sale-list/product-sale-list.ts` *(ídem)*
- `src/app/features/dashboard/dashboard.html` *(envuelve tarjetas dependientes de permisos)*
- `src/app/features/dashboard/dashboard.ts` *(añade `HasPermission` al `imports`)*
- `src/app/layout/header/header.ts` y `header.html` *(si aún no tenían los `input()`/`output()` para sesión)*
- `src/app/layout/aside/aside.ts` y `aside.html` *(ídem)*

Archivos de **ISS-02 → ISS-08 que no se tocan**: `filter-rows.ts`, `api-error.ts`, `to-number.ts`, `notification.ts`, `session-store.ts`, `auth.ts`, `auth-interceptor.ts`, `error-interceptor.ts`, `login/`, `profile/`, `status-tag`, `page-header`, `empty-state`.

---

## Notas del docente

- **`authGuard`** responde **quién eres**. **`permissionGuard`** responde **qué puedes hacer**. **`authOnlyGuard`** cierra pantallas que **no existen** en Fase I (perfil, admin).
- **`createUrlTree` en guards**, no `router.navigate`: el `Router` evalúa la redirección **antes** de activar el componente, sin parpadeos.
- **`*appHasPermission` es estructural**: crea/destruye la vista embebida y **reacciona a `permissions()`**. `@if` evalúa cualquier condición; la directiva evalúa **solo permisos RBAC**.
- **Menú filtrado con `computed()` en `Shell`**: `NAV` es estático; el `Shell` filtra cada grupo con `SessionStore.canPermission()` y oculta **Seguridad** cuando `authEnabled` es `false`.
- **`#userMenuPanel`**, no `#userMenu`: la referencia de plantilla taparía el método `userMenu()` en el template.
- **Ventas y detalle en Fase II**: solo listar y registrar. Cancelar/eliminar están **ocultos por permiso** aunque las rutas Express los acepten, porque el **catálogo RBAC** no los concede. **No borres el código de Fase I**: solo envuélvelo con `*appHasPermission`.
- **`/forbidden` explica el 403** con el permiso faltante. Es UX, no seguridad: el backend vuelve a validar cada petición.
- **`authOnlyGuard`** solo tiene sentido junto con `AUTH_ENABLED=false` en el backend. Con las banderas desemparejadas la UI no se bloquea pero la API responde `401`.

---

## Navegación

⬅️ **Anterior:** ISS-08 — Autenticación JWT, perfil y permisos efectivos
⬆️ **Ruta:** Frontend-Express · **Fase II · Bloque 2 de 3 (protección)**
➡️ **Siguiente:** ISS-10 — Administración del RBAC (usuarios, roles, recursos, pivotes)