# 🛠 ISS-10 · Administración RBAC: usuarios, roles, recursos y pivotes

> **Proyecto frontend:** `front-textilclean-express` (carpeta real: `frontend-2026`)
> **Ruta frontend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026`
> **Proyecto backend:** `app-textilclean-express`
> **Ruta backend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express`
> **Fase:** II · Auth + RBAC · Bloque **3 de 3** (administración) · **Bloqueado por:** ISS-09 · **Habilita:** ISS-11
> **Vigencia:** revisión alineada con guía del docente del 23-oct-2026.
> **Capa:** 🛠 Construir (ejecutar, verificar y entregar)

---

## 0. Antes de tocar nada

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
pwd
```

Verifica **ISS-09** cerrada:

```bash
ls src/app/core/guards/           # auth  guest  permission  auth-only
ls src/app/shared/directives/     # has-permission
ls src/app/layout/shell/          # shell  nav.config
```

Y que existen los modelos `user`, `role`, `resource`, `auth`:

```bash
ls src/app/core/models/
```

---

## Objetivo y alcance

> **Fase II · bloque 3 de 3 — Formularios de las entidades Auth.** El formulario de sesión (login/logout/refresh/perfil) es **ISS-08**; aquí se construyen los **CRUD** de las **cinco entidades de autorización**. `refresh_tokens` **no tiene pantalla**: se gestiona solo con la sesión, y exponerlo permitiría revocar tokens ajenos sin contexto de negocio.

```
User ──< role_users >── Role ──< resource_roles >── Resource
              (status active)          (status active)      (method + path)
```

**Cinco pantallas:**

| Ruta | Entidad | Endpoint | Respuesta de lista |
|---|---|---|---|
| `/admin/usuarios` | User | `/api/usuarios` | `{ users }` |
| `/admin/roles` | Role | `/api/roles` | `{ roles }` |
| `/admin/recursos` | Resource | `/api/recursos` | `{ resources }` |
| `/admin/asignaciones` | RoleUser | `/api/asignaciones-rol` | `{ assignments }` |
| `/admin/permisos` | ResourceRole | `/api/concesiones-rol` | `{ grants }` |

> **Nombres del backend, no traducciones.** Usa exactamente `usuarios`, `recursos`, `asignaciones-rol` y `concesiones-rol`. Los nombres `users`, `resources`, `role-users` y `resource-roles` corresponden a las **tablas**, no a las **rutas HTTP**.

**Antes de construir:** completa **Usuarios** y **Roles** antes de **Recursos**; después vincula **usuario-rol** y **rol-recurso**. Reutiliza componentes y el patrón CRUD ya estudiado.

**Evidencia de aprendizaje:** verifica la **cadena de autorización completa** y que **cambiar un permiso actualiza el menú** sin reconstruir el layout.

**Equipo y terminal:** Ubuntu WSL, terminal del editor, carpeta `frontend-2026`.

---

## Criterios de aceptación (ISS-10)

- [ ] `admin` lista, crea y edita usuarios; la **contraseña y el estado** solo se envían **al crear**.
- [ ] **“Ver permisos”** muestra `permissions` con `role_name` y `(method, path)`.
- [ ] **Roles**: CRUD con baja lógica; el `name` se guarda en **MAYÚSCULAS**.
- [ ] **Recursos**: crear/editar/desactivar/eliminar; `path` validado con `/`.
- [ ] **Asignaciones**: crear vínculo usuario-rol y retirarlo; **no se puede duplicar**.
- [ ] **Concesiones**: crear vínculo rol-resource; el select muestra **método + path**.
- [ ] Un permiso revocado **desaparece del menú** tras “Actualizar permisos”.
- [ ] **`seller`** no puede abrir las rutas `/admin/*` sin el `GET` correspondiente.
- [ ] `ng serve` compila sin errores.

---

## 10.1 Regla de oro del RBAC

Un usuario puede ejecutar `MÉTODO /ruta` **si y solo si** existe la cadena:

1. `role_users` con `user_id = usuario`, `status = active`.
2. `roles` con `status = active`.
3. `resource_roles` con ese `role_id`, `status = active`.
4. `resources` con el `path` y `method` **exactos**, `status = active`.

Si cualquier eslabón está inactivo, el backend responde **`403` (deny by default)**. La UI replica esta lógica en `SessionStore.canPermission()` con los permisos efectivos que devuelve `GET /api/permisos`.

---

## 10.2 Generar los componentes con CLI

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
ng generate component features/admin/users/user-list --skip-tests --defaults
ng generate component features/admin/users/user-form --skip-tests --defaults
ng generate component features/admin/roles/role-list --skip-tests --defaults
ng generate component features/admin/roles/role-form --skip-tests --defaults
ng generate component features/admin/resources/resource-list --skip-tests --defaults
ng generate component features/admin/resources/resource-form --skip-tests --defaults
ng generate component features/admin/role-users/role-user-list --skip-tests --defaults
ng generate component features/admin/resource-roles/resource-role-list --skip-tests --defaults
```

> Los servicios `*-api.ts` se crean en esta ISS (algunos podrían existir ya desde ISS-02).

Comprueba la estructura:

```bash
ls -R src/app/features/admin/
```

---

## 10.3 Utilidades compartidas

```bash
cat > src/app/core/utils/http-method.ts <<'EOF'
import { HttpMethod } from '../models/resource.model';

/** Severidad del `p-tag` según el método HTTP. */
export function methodSeverity(
  method: HttpMethod | undefined,
): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
  switch (method) {
    case 'GET':
      return 'info';
    case 'POST':
      return 'success';
    case 'PUT':
    case 'PATCH':
      return 'warn';
    case 'DELETE':
      return 'danger';
    default:
      return 'secondary';
  }
}

export const HTTP_METHODS: Array<{ label: string; value: HttpMethod }> = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
];
EOF
```

### Modelos de payload

```bash
cat > src/app/core/models/admin.model.ts <<'EOF'
import { HttpMethod } from './resource.model';
import { Status } from './api.model';

// Usuarios
export interface UserPayload {
  username: string;
  email: string;
  password?: string;
  avatar?: string | null;
  status?: Status;
}

// Roles
export interface RolePayload {
  name: string;
  description: string | null;
  status?: Status;
}

// Recursos
export interface ResourcePayload {
  path: string;
  method: HttpMethod;
  description: string | null;
  status?: Status;
}

// Asignaciones usuario-rol
export interface RoleUser {
  id: number;
  user_id: number;
  role_id: number;
  status: Status;
  created_at?: string;
}

export interface RoleUserPayload {
  user_id: number;
  role_id: number;
}

// Concesiones rol-recurso
export interface ResourceRole {
  id: number;
  role_id: number;
  resource_id: number;
  status: Status;
  created_at?: string;
}

export interface ResourceRolePayload {
  role_id: number;
  resource_id: number;
}
EOF
```

---

## 10.4 Usuarios

### 10.4.1 `UserApi`

```bash
mkdir -p src/app/features/admin/users
cat > src/app/features/admin/users/user-api.ts <<'EOF'
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EffectivePermission } from '../../../core/models/auth.model';
import { UserPayload } from '../../../core/models/admin.model';
import { User } from '../../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuarios`;

  list(): Observable<User[]> {
    return this.http
      .get<{ users: User[] }>(this.base)
      .pipe(map((r) => r.users));
  }

  get(id: number): Observable<User> {
    return this.http
      .get<{ user: User }>(`${this.base}/${id}`)
      .pipe(map((r) => r.user));
  }

  create(payload: UserPayload): Observable<User> {
    return this.http
      .post<{ user: User }>(this.base, payload)
      .pipe(map((r) => r.user));
  }

  update(id: number, payload: Partial<UserPayload>): Observable<User> {
    return this.http
      .patch<{ user: User }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.user));
  }

  permissions(id: number): Observable<EffectivePermission[]> {
    return this.http
      .get<{ permissions: EffectivePermission[] }>(
        `${this.base}/${id}/permisos`,
      )
      .pipe(map((r) => r.permissions));
  }

  changePassword(
    id: number,
    payload: { current_password: string; new_password: string },
  ): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/password`, payload);
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
EOF
```

### 10.4.2 `UserForm`

```bash
cat > src/app/features/admin/users/user-form/user-form.ts <<'EOF'
import { Component, effect, inject, input, output } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { Status } from '../../../../core/models/api.model';
import { UserPayload } from '../../../../core/models/admin.model';
import { User } from '../../../../core/models/user.model';

@Component({
  host: { class: 'block' },
  selector: 'app-user-form',
  imports: [
    ButtonModule,
    InputTextModule,
    MessageModule,
    PasswordModule,
    ReactiveFormsModule,
    SelectModule,
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
})
export class UserForm {
  readonly user = input<User | null>(null);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<UserPayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    avatar: [''],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.user();
      this.resetKey();

      this.form.reset({
        username: current?.username ?? '',
        email: current?.email ?? '',
        password: '',
        avatar: '',
        status: current?.status ?? 'active',
      });

      const password = this.form.controls.password;
      const status = this.form.controls.status;

      if (current) {
        password.clearValidators();
        password.disable();
        status.disable();
      } else {
        password.setValidators([
          Validators.required,
          Validators.minLength(8),
        ]);
        password.enable();
        status.enable();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();

    const payload: UserPayload = {
      username: value.username.trim(),
      email: value.email.trim(),
      avatar: value.avatar.trim() || null,
    };

    if (!this.user()) {
      payload.status = value.status;
      payload.password = value.password;
    }

    this.saved.emit(payload);
  }
}
EOF
```

`user-form.html`:

```bash
cat > src/app/features/admin/users/user-form/user-form.html <<'EOF'
<form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label for="u-username" class="mb-1 block text-sm font-medium text-slate-700">
        Usuario <span class="text-red-500">*</span>
      </label>
      <input id="u-username" pInputText formControlName="username" class="w-full" />
      @if (form.controls.username.touched && form.controls.username.invalid) {
        <p-message severity="error" size="small" variant="simple" styleClass="mt-1">
          Mínimo 3 caracteres.
        </p-message>
      }
    </div>
    <div>
      <label for="u-email" class="mb-1 block text-sm font-medium text-slate-700">
        Email <span class="text-red-500">*</span>
      </label>
      <input id="u-email" pInputText type="email" formControlName="email" class="w-full" />
      @if (form.controls.email.touched && form.controls.email.invalid) {
        <p-message severity="error" size="small" variant="simple" styleClass="mt-1">
          Formato inválido.
        </p-message>
      }
    </div>
  </div>

  @if (!user()) {
    <div>
      <label for="u-pass" class="mb-1 block text-sm font-medium text-slate-700">
        Contraseña <span class="text-red-500">*</span>
      </label>
      <p-password inputId="u-pass" formControlName="password" [feedback]="false" [toggleMask]="true" [fluid]="true" />
      @if (form.controls.password.touched && form.controls.password.invalid) {
        <p-message severity="error" size="small" variant="simple" styleClass="mt-1">
          Mínimo 8 caracteres.
        </p-message>
      }
    </div>
  }

  <div>
    <label for="u-avatar" class="mb-1 block text-sm font-medium text-slate-700">Avatar (URL)</label>
    <input id="u-avatar" pInputText formControlName="avatar" class="w-full" />
  </div>

  @if (!user()) {
    <div>
      <label for="u-status" class="mb-1 block text-sm font-medium text-slate-700">Estado</label>
      <p-select inputId="u-status" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" [fluid]="true" />
    </div>
  }

  <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
    <button pButton type="button" severity="secondary" outlined (click)="cancelled.emit()">
      <span pButtonLabel>Cancelar</span>
    </button>
    <button pButton type="submit" [loading]="saving()">
      <i pButtonIcon class="pi pi-check"></i>
      <span pButtonLabel>Guardar</span>
    </button>
  </div>
</form>
EOF

cat > src/app/features/admin/users/user-form/user-form.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

> **`password` y `status` se envían solo en el alta.** `PATCH /api/usuarios/:id` no los acepta y el backend podría **rehashear** la contraseña sin verificar la actual. El estado se cambia con `/deactivate`.

### 10.4.3 `UserList` (con “Ver permisos”)

```bash
cat > src/app/features/admin/users/user-list/user-list.ts <<'EOF'
import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { EffectivePermission } from '../../../../core/models/auth.model';
import { UserPayload } from '../../../../core/models/admin.model';
import { User } from '../../../../core/models/user.model';
import { SessionStore } from '../../../../core/services/session-store';
import { NotificationService } from '../../../../core/services/notification';
import { toApiMessage } from '../../../../core/utils/api-error';
import { filterRows } from '../../../../core/utils/filter-rows';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import { UserApi } from '../user-api';
import { UserForm } from '../user-form/user-form';

@Component({
  host: { class: 'block' },
  selector: 'app-user-list',
  imports: [
    ButtonModule, DialogModule, EmptyState, InputTextModule, MessageModule,
    PageHeader, StatusTag, TableModule, TagModule, TooltipModule, UserForm,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList {
  private readonly api = inject(UserApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly session = inject(SessionStore);

  readonly rows = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');
  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (u) => [u.username, u.email]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<User | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() =>
    this.editing() ? 'Editar usuario' : 'Nuevo usuario',
  );

  readonly accessVisible = signal(false);
  readonly accessUser = signal<User | null>(null);
  readonly access = signal<EffectivePermission[]>([]);
  readonly accessRoles = computed(() => {
    const byId = new Map<number, string>();
    for (const p of this.access()) byId.set(p.role_id, p.role_name);
    return [...byId.entries()].map(([id, name]) => ({ id, name }));
  });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (rows) => { this.rows.set(rows); this.loading.set(false); },
      error: (e: unknown) => {
        this.rows.set([]); this.error.set(toApiMessage(e)); this.loading.set(false);
      },
    });
  }

  isSelf(user: User): boolean { return this.session.user()?.id === user.id; }

  openCreate(): void { this.editing.set(null); this.resetKey.update(k => k + 1); this.dialogVisible.set(true); }
  openEdit(u: User): void { this.editing.set(u); this.resetKey.update(k => k + 1); this.dialogVisible.set(true); }

  save(payload: UserPayload): void {
    const current = this.editing();
    this.saving.set(true);
    const req = current ? this.api.update(current.id, payload) : this.api.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false); this.dialogVisible.set(false);
        this.notify.success(current ? 'Usuario actualizado' : 'Usuario creado');
        this.load();
      },
      error: (e: unknown) => {
        this.saving.set(false); this.notify.error('No se pudo guardar', toApiMessage(e));
      },
    });
  }

  viewAccess(user: User): void {
    this.accessUser.set(user);
    this.accessVisible.set(true);
    this.api.permissions(user.id).subscribe({
      next: (permissions) => this.access.set(permissions),
      error: (e: unknown) => this.notify.error('No se pudieron cargar los permisos', toApiMessage(e)),
    });
  }

  deactivate(u: User): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar al usuario «${u.username}»?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => this.api.deactivate(u.id).subscribe({
        next: () => { this.notify.warn('Usuario desactivado'); this.load(); },
        error: (e: unknown) => this.notify.error('No se pudo desactivar', toApiMessage(e)),
      }),
    });
  }

  remove(u: User): void {
    if (this.isSelf(u)) return;
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará «${u.username}». No se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.api.remove(u.id).subscribe({
        next: () => { this.notify.success('Usuario eliminado'); this.load(); },
        error: (e: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(e)),
      }),
    });
  }
}
EOF

cat > src/app/features/admin/users/user-list/user-list.html <<'EOF'
<app-page-header title="Usuarios" subtitle="Administra el alta, estado y acceso de cada usuario.">
  <p-tag [value]="rows().length + ' totales'" severity="info" [rounded]="true" />
  <ng-container *appHasPermission="'POST /api/usuarios'">
    <button pButton type="button" (click)="openCreate()">
      <i pButtonIcon class="pi pi-plus"></i>
      <span pButtonLabel>Nuevo usuario</span>
    </button>
  </ng-container>
</app-page-header>

@if (error()) {
  <p-message severity="error" styleClass="mb-4 w-full">{{ error() }}</p-message>
}

<div class="rounded-xl border border-slate-200 bg-white">
  <p-table [value]="visibleRows()" [loading]="loading()" dataKey="id" tableStyleClass="min-w-4xl">
    <ng-template #caption>
      <input pInputText type="search" aria-label="Buscar usuarios"
        placeholder="Buscar por usuario o email…"
        [value]="filter()" (input)="filter.set($any($event.target).value)" class="w-full" />
    </ng-template>
    <ng-template #header>
      <tr>
        <th>Usuario</th><th>Email</th><th>Estado</th>
        <th class="w-56 text-right">Acciones</th>
      </tr>
    </ng-template>
    <ng-template #body let-u>
      <tr>
        <td class="font-medium">{{ u.username }}</td>
        <td class="text-sm text-slate-600">{{ u.email || '—' }}</td>
        <td><app-status-tag [status]="u.status" /></td>
        <td>
          <div class="flex justify-end gap-1">
            <button pButton text rounded severity="info" icon="pi pi-eye"
              aria-label="Ver permisos" pTooltip="Ver permisos" (click)="viewAccess(u)"></button>
            <ng-container *appHasPermission="'PATCH /api/usuarios/:id'">
              <button pButton text rounded severity="secondary" icon="pi pi-pencil"
                aria-label="Editar usuario" pTooltip="Editar" (click)="openEdit(u)"></button>
            </ng-container>
            <ng-container *appHasPermission="'PATCH /api/usuarios/:id/deactivate'">
              <button pButton text rounded severity="warn" icon="pi pi-ban"
                aria-label="Baja lógica" pTooltip="Baja lógica" (click)="deactivate(u)"></button>
            </ng-container>
            <ng-container *appHasPermission="'DELETE /api/usuarios/:id'">
              <button pButton text rounded severity="danger" icon="pi pi-trash"
                aria-label="Eliminar" pTooltip="Eliminar"
                [disabled]="isSelf(u)" (click)="remove(u)"></button>
            </ng-container>
          </div>
        </td>
      </tr>
    </ng-template>
    <ng-template #emptymessage>
      <tr><td colspan="4"><app-empty-state icon="pi pi-users" title="Sin usuarios"
        message="Crea el primero con «Nuevo usuario»." /></td></tr>
    </ng-template>
  </p-table>
</div>

<p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)"
  [header]="title()" [modal]="true" [draggable]="false" [resizable]="false"
  [dismissableMask]="true" styleClass="w-full max-w-2xl mx-4">
  <app-user-form [user]="editing()" [saving]="saving()" [resetKey]="resetKey()"
    (saved)="save($event)" (cancelled)="dialogVisible.set(false)" />
</p-dialog>

<p-dialog [visible]="accessVisible()" (visibleChange)="accessVisible.set($event)"
  [header]="'Permisos de ' + (accessUser()?.username ?? '')" [modal]="true"
  [draggable]="false" [resizable]="false" styleClass="w-full max-w-3xl mx-4">
  <div class="flex flex-wrap gap-2">
    @for (role of accessRoles(); track role.id) {
      <p-tag [value]="role.name" severity="info" [rounded]="true" />
    }
  </div>
  <p-table [value]="access()" dataKey="resource_id" tableStyleClass="min-w-3xl mt-4">
    <ng-template #header>
      <tr><th>Método</th><th>Ruta</th><th>Descripción</th><th>Rol</th></tr>
    </ng-template>
    <ng-template #body let-p>
      <tr>
        <td><p-tag [value]="p.method" severity="secondary" [rounded]="true" /></td>
        <td class="font-mono text-xs">{{ p.path }}</td>
        <td class="text-sm">{{ p.description || '—' }}</td>
        <td><p-tag [value]="p.role_name" severity="info" [rounded]="true" /></td>
      </tr>
    </ng-template>
  </ng-table>
</p-dialog>
EOF

cat > src/app/features/admin/users/user-list/user-list.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

> ⚠️ En `user-list.html`, sustituye `<ng-table>` por `<ng-template>` al pegar. Debería ser:
> ```
> <ng-template #emptymessage>…</ng-template>
> ```
> **Añade `HasPermission` al `imports`** del componente.

### 10.4.4 Tabla de permisos exactos (usuarios)

| Acción | Permiso |
|---|---|
| Crear | `POST /api/usuarios` |
| Editar | `PATCH /api/usuarios/:id` |
| Baja lógica | `PATCH /api/usuarios/:id/deactivate` |
| Baja física | `DELETE /api/usuarios/:id` |
| Cambiar contraseña | `PATCH /api/usuarios/:id/password` |
| Ver permisos | `GET /api/usuarios/:id/permisos` |

---

## 10.5 Roles

### 10.5.1 `RoleApi`

```bash
mkdir -p src/app/features/admin/roles
cat > src/app/features/admin/roles/role-api.ts <<'EOF'
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RolePayload } from '../../../core/models/admin.model';
import { Role } from '../../../core/models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/roles`;

  list(): Observable<Role[]> {
    return this.http.get<{ roles: Role[] }>(this.base).pipe(map((r) => r.roles));
  }

  create(payload: RolePayload): Observable<Role> {
    return this.http.post<{ role: Role }>(this.base, payload).pipe(map((r) => r.role));
  }

  update(id: number, payload: Partial<RolePayload>): Observable<Role> {
    return this.http.patch<{ role: Role }>(`${this.base}/${id}`, payload).pipe(map((r) => r.role));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
EOF
```

### 10.5.2 `RoleForm` + `RoleList`

```bash
cat > src/app/features/admin/roles/role-form/role-form.ts <<'EOF'
import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { Status } from '../../../../core/models/api.model';
import { RolePayload } from '../../../../core/models/admin.model';
import { Role } from '../../../../core/models/role.model';

@Component({
  host: { class: 'block' },
  selector: 'app-role-form',
  imports: [ButtonModule, InputTextModule, MessageModule, ReactiveFormsModule, TextareaModule],
  templateUrl: './role-form.html',
  styleUrl: './role-form.css',
})
export class RoleForm {
  readonly role = input<Role | null>(null);
  readonly resetKey = input(0);
  readonly saving = input(false);
  readonly saved = output<RolePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    description: [''],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.role();
      this.resetKey();
      this.form.reset({
        name: current?.name ?? '',
        description: current?.description ?? '',
        status: current?.status ?? 'active',
      });
      if (current) this.form.controls.status.disable();
      else this.form.controls.status.enable();
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.saved.emit({
      name: v.name.trim().toUpperCase(),
      description: v.description.trim() || null,
      ...(this.role() ? {} : { status: v.status }),
    });
  }
}
EOF

cat > src/app/features/admin/roles/role-form/role-form.html <<'EOF'
<form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
  <div>
    <label for="r-name" class="mb-1 block text-sm font-medium text-slate-700">
      Nombre <span class="text-red-500">*</span>
    </label>
    <input id="r-name" pInputText formControlName="name" class="w-full"
      placeholder="ADMIN, SELLER, BUYER…" />
    <p class="mt-1 text-xs text-slate-500">Se guarda en MAYÚSCULAS.</p>
  </div>
  <div>
    <label for="r-desc" class="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
    <textarea id="r-desc" pTextarea formControlName="description" rows="2" class="w-full"></textarea>
  </div>
  <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
    <button pButton type="button" severity="secondary" outlined (click)="cancelled.emit()">
      <span pButtonLabel>Cancelar</span>
    </button>
    <button pButton type="submit" [loading]="saving()">
      <i pButtonIcon class="pi pi-check"></i><span pButtonLabel>Guardar</span>
    </button>
  </div>
</form>
EOF

cat > src/app/features/admin/roles/role-form/role-form.css <<'EOF'
/* Vacío a propósito. */
EOF
```

```bash
cat > src/app/features/admin/roles/role-list/role-list.ts <<'EOF'
import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { RolePayload } from '../../../../core/models/admin.model';
import { Role } from '../../../../core/models/role.model';
import { NotificationService } from '../../../../core/services/notification';
import { toApiMessage } from '../../../../core/utils/api-error';
import { filterRows } from '../../../../core/utils/filter-rows';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import { RoleApi } from '../role-api';
import { RoleForm } from '../role-form/role-form';

@Component({
  host: { class: 'block' }, selector: 'app-role-list',
  imports: [ButtonModule, DialogModule, EmptyState, HasPermission, InputTextModule,
    MessageModule, PageHeader, RoleForm, StatusTag, TableModule, TagModule, TooltipModule],
  templateUrl: './role-list.html', styleUrl: './role-list.css',
})
export class RoleList {
  private readonly api = inject(RoleApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<Role[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');
  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (r) => [r.name, r.description]),
  );
  readonly dialogVisible = signal(false);
  readonly editing = signal<Role | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() => (this.editing() ? 'Editar rol' : 'Nuevo rol'));

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.list().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: (e: unknown) => { this.rows.set([]); this.error.set(toApiMessage(e)); this.loading.set(false); },
    });
  }
  openCreate(): void { this.editing.set(null); this.resetKey.update(k => k + 1); this.dialogVisible.set(true); }
  openEdit(r: Role): void { this.editing.set(r); this.resetKey.update(k => k + 1); this.dialogVisible.set(true); }

  save(payload: RolePayload): void {
    const current = this.editing();
    this.saving.set(true);
    const req = current ? this.api.update(current.id, payload) : this.api.create(payload);
    req.subscribe({
      next: () => { this.saving.set(false); this.dialogVisible.set(false);
        this.notify.success(current ? 'Rol actualizado' : 'Rol creado'); this.load(); },
      error: (e: unknown) => { this.saving.set(false); this.notify.error('No se pudo guardar', toApiMessage(e)); },
    });
  }

  deactivate(r: Role): void {
    this.confirmation.confirm({ header: 'Baja lógica', message: `¿Desactivar «${r.name}»?`,
      icon: 'pi pi-exclamation-triangle', acceptLabel: 'Desactivar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => this.api.deactivate(r.id).subscribe({
        next: () => { this.notify.warn('Rol desactivado'); this.load(); },
        error: (e: unknown) => this.notify.error('No se pudo desactivar', toApiMessage(e)),
      }),
    });
  }

  remove(r: Role): void {
    this.confirmation.confirm({ header: 'Eliminar rol', message: `Se borrará «${r.name}»`,
      icon: 'pi pi-trash', acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.api.remove(r.id).subscribe({
        next: () => { this.notify.success('Rol eliminado'); this.load(); },
        error: (e: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(e)),
      }),
    });
  }
}
EOF

cat > src/app/features/admin/roles/role-list/role-list.html <<'EOF'
<app-page-header title="Roles" subtitle="Los roles agrupan permisos. El nombre se guarda en MAYÚSCULAS.">
  <p-tag [value]="rows().length + ' totales'" severity="info" [rounded]="true" />
  <ng-container *appHasPermission="'POST /api/roles'">
    <button pButton type="button" (click)="openCreate()">
      <i pButtonIcon class="pi pi-plus"></i><span pButtonLabel>Nuevo rol</span>
    </button>
  </ng-container>
</app-page-header>

@if (error()) { <p-message severity="error" styleClass="mb-4 w-full">{{ error() }}</p-message> }

<div class="rounded-xl border border-slate-200 bg-white">
  <p-table [value]="visibleRows()" [loading]="loading()" dataKey="id" tableStyleClass="min-w-3xl">
    <ng-template #caption>
      <input pInputText type="search" aria-label="Buscar roles" placeholder="Buscar por nombre…"
        [value]="filter()" (input)="filter.set($any($event.target).value)" class="w-full" />
    </ng-template>
    <ng-template #header>
      <tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th class="w-40 text-right">Acciones</th></tr>
    </ng-template>
    <ng-template #body let-r>
      <tr>
        <td class="font-medium">{{ r.name }}</td>
        <td class="text-sm text-slate-600">{{ r.description || '—' }}</td>
        <td><app-status-tag [status]="r.status" /></td>
        <td>
          <div class="flex justify-end gap-1">
            <ng-container *appHasPermission="'PATCH /api/roles/:id'">
              <button pButton text rounded severity="secondary" icon="pi pi-pencil"
                aria-label="Editar rol" (click)="openEdit(r)"></button>
            </ng-container>
            <ng-container *appHasPermission="'PATCH /api/roles/:id/deactivate'">
              <button pButton text rounded severity="warn" icon="pi pi-ban"
                aria-label="Baja lógica" (click)="deactivate(r)"></button>
            </ng-container>
            <ng-container *appHasPermission="'DELETE /api/roles/:id'">
              <button pButton text rounded severity="danger" icon="pi pi-trash"
                aria-label="Eliminar rol" (click)="remove(r)"></button>
            </ng-container>
          </div>
        </td>
      </tr>
    </ng-template>
    <ng-template #emptymessage>
      <tr><td colspan="4"><app-empty-state icon="pi pi-tags" title="Sin roles"
        message="Crea el primero con «Nuevo rol»." /></td></tr>
    </ng-template>
  </p-table>
</div>

<p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)"
  [header]="title()" [modal]="true" [draggable]="false" [resizable]="false"
  [dismissableMask]="true" styleClass="w-full max-w-xl mx-4">
  <app-role-form [role]="editing()" [saving]="saving()" [resetKey]="resetKey()"
    (saved)="save($event)" (cancelled)="dialogVisible.set(false)" />
</p-dialog>
EOF

cat > src/app/features/admin/roles/role-list/role-list.css <<'EOF'
/* Vacío a propósito. */
EOF
```

> **El nombre del rol no autoriza nada.** Un `ADMIN` sin filas activas en `resource_roles` **no puede ejecutar ninguna operación**.

---

## 10.6 Recursos

### 10.6.1 `ResourceApi`

```bash
mkdir -p src/app/features/admin/resources
cat > src/app/features/admin/resources/resource-api.ts <<'EOF'
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ResourcePayload } from '../../../core/models/admin.model';
import { Resource } from '../../../core/models/resource.model';

@Injectable({ providedIn: 'root' })
export class ResourceApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/recursos`;

  list(): Observable<Resource[]> {
    return this.http.get<{ resources: Resource[] }>(this.base).pipe(map((r) => r.resources));
  }

  create(payload: ResourcePayload): Observable<Resource> {
    return this.http.post<{ resource: Resource }>(this.base, payload).pipe(map((r) => r.resource));
  }

  update(id: number, payload: Partial<ResourcePayload>): Observable<Resource> {
    return this.http.patch<{ resource: Resource }>(`${this.base}/${id}`, payload).pipe(map((r) => r.resource));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
EOF
```

### 10.6.2 `ResourceForm`

```bash
cat > src/app/features/admin/resources/resource-form/resource-form.ts <<'EOF'
import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Status } from '../../../../core/models/api.model';
import { ResourcePayload } from '../../../../core/models/admin.model';
import { HttpMethod, Resource } from '../../../../core/models/resource.model';
import { HTTP_METHODS } from '../../../../core/utils/http-method';

@Component({
  host: { class: 'block' }, selector: 'app-resource-form',
  imports: [ButtonModule, InputTextModule, MessageModule, ReactiveFormsModule, SelectModule],
  templateUrl: './resource-form.html', styleUrl: './resource-form.css',
})
export class ResourceForm {
  readonly resource = input<Resource | null>(null);
  readonly resetKey = input(0);
  readonly saving = input(false);
  readonly saved = output<ResourcePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  readonly methods = HTTP_METHODS;

  readonly form = this.fb.group({
    path: ['', [Validators.required, Validators.pattern(/^\/.*$/)]],
    method: ['GET' as HttpMethod, [Validators.required]],
    description: [''],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.resource();
      this.resetKey();
      this.form.reset({
        path: current?.path ?? '',
        method: current?.method ?? 'GET',
        description: current?.description ?? '',
        status: current?.status ?? 'active',
      });
      if (current) this.form.controls.status.disable();
      else this.form.controls.status.enable();
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.saved.emit({
      path: v.path.trim(),
      method: v.method,
      description: v.description.trim() || null,
      ...(this.resource() ? {} : { status: v.status }),
    });
  }
}
EOF

cat > src/app/features/admin/resources/resource-form/resource-form.html <<'EOF'
<form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
  <div class="grid gap-4 sm:grid-cols-[2fr_1fr]">
    <div>
      <label for="re-path" class="mb-1 block text-sm font-medium text-slate-700">
        Ruta <span class="text-red-500">*</span>
      </label>
      <input id="re-path" pInputText formControlName="path"
        placeholder="/api/clientes/:id" class="w-full font-mono text-sm" />
      <p class="mt-1 text-xs text-slate-500">Debe empezar por <code>/</code>. Usa <code>:id</code> para parámetros.</p>
      @if (form.controls.path.touched && form.controls.path.invalid) {
        <p-message severity="error" size="small" variant="simple" styleClass="mt-1">
          La ruta debe empezar por «/».
        </p-message>
      }
    </div>
    <div>
      <label for="re-method" class="mb-1 block text-sm font-medium text-slate-700">
        Método <span class="text-red-500">*</span>
      </label>
      <p-select inputId="re-method" formControlName="method"
        [options]="methods" optionLabel="label" optionValue="value" [fluid]="true" />
    </div>
  </div>
  <div>
    <label for="re-desc" class="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
    <input id="re-desc" pInputText formControlName="description" class="w-full" />
  </div>
  <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
    <button pButton type="button" severity="secondary" outlined (click)="cancelled.emit()">
      <span pButtonLabel>Cancelar</span>
    </button>
    <button pButton type="submit" [loading]="saving()">
      <i pButtonIcon class="pi pi-check"></i><span pButtonLabel>Guardar</span>
    </button>
  </div>
</form>
EOF

cat > src/app/features/admin/resources/resource-form/resource-form.css <<'EOF'
/* Vacío a propósito. */
EOF
```

### 10.6.3 `ResourceList` (con filtro por método)

```bash
cat > src/app/features/admin/resources/resource-list/resource-list.ts <<'EOF'
import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ResourcePayload } from '../../../../core/models/admin.model';
import { HttpMethod, Resource } from '../../../../core/models/resource.model';
import { NotificationService } from '../../../../core/services/notification';
import { toApiMessage } from '../../../../core/utils/api-error';
import { filterRows } from '../../../../core/utils/filter-rows';
import { HTTP_METHODS, methodSeverity } from '../../../../core/utils/http-method';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import { ResourceApi } from '../resource-api';
import { ResourceForm } from '../resource-form/resource-form';

@Component({
  host: { class: 'block' }, selector: 'app-resource-list',
  imports: [ButtonModule, DialogModule, EmptyState, HasPermission, InputTextModule,
    MessageModule, PageHeader, ResourceForm, SelectModule, StatusTag, TableModule,
    TagModule, TooltipModule],
  templateUrl: './resource-list.html', styleUrl: './resource-list.css',
})
export class ResourceList {
  private readonly api = inject(ResourceApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly methods = HTTP_METHODS;
  readonly methodSeverity = methodSeverity;

  readonly rows = signal<Resource[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');
  readonly methodFilter = signal<HttpMethod | null>(null);

  readonly countsByMethod = computed(() => {
    const c = new Map<string, number>();
    for (const row of this.rows()) c.set(row.method, (c.get(row.method) ?? 0) + 1);
    return c;
  });

  readonly visibleRows = computed(() => {
    const m = this.methodFilter();
    const filtered = filterRows(this.rows(), this.filter(), (r) => [
      r.path, r.description, r.method,
    ]);
    return m ? filtered.filter((r) => r.method === m) : filtered;
  });

  readonly dialogVisible = signal(false);
  readonly editing = signal<Resource | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() => (this.editing() ? 'Editar recurso' : 'Nuevo recurso'));

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.list().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: (e: unknown) => { this.rows.set([]); this.error.set(toApiMessage(e)); this.loading.set(false); },
    });
  }
  openCreate(): void { this.editing.set(null); this.resetKey.update(k => k + 1); this.dialogVisible.set(true); }
  openEdit(r: Resource): void { this.editing.set(r); this.resetKey.update(k => k + 1); this.dialogVisible.set(true); }

  save(payload: ResourcePayload): void {
    const current = this.editing();
    this.saving.set(true);
    const req = current ? this.api.update(current.id, payload) : this.api.create(payload);
    req.subscribe({
      next: () => { this.saving.set(false); this.dialogVisible.set(false);
        this.notify.success(current ? 'Recurso actualizado' : 'Recurso creado'); this.load(); },
      error: (e: unknown) => { this.saving.set(false); this.notify.error('No se pudo guardar', toApiMessage(e)); },
    });
  }

  deactivate(r: Resource): void {
    this.confirmation.confirm({ header: 'Baja lógica', message: `¿Desactivar ${r.method} ${r.path}?`,
      icon: 'pi pi-exclamation-triangle', acceptLabel: 'Desactivar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => this.api.deactivate(r.id).subscribe({
        next: () => { this.notify.warn('Recurso desactivado'); this.load(); },
        error: (e: unknown) => this.notify.error('No se pudo desactivar', toApiMessage(e)),
      }),
    });
  }

  remove(r: Resource): void {
    this.confirmation.confirm({ header: 'Eliminar recurso',
      message: `Se borrará ${r.method} ${r.path}. Rompe las concesiones históricas.`,
      icon: 'pi pi-trash', acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.api.remove(r.id).subscribe({
        next: () => { this.notify.success('Recurso eliminado'); this.load(); },
        error: (e: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(e)),
      }),
    });
  }
}
EOF

cat > src/app/features/admin/resources/resource-list/resource-list.html <<'EOF'
<app-page-header title="Recursos HTTP" subtitle="Catálogo de capacidades. El par (path, method) es único.">
  @for (m of methods; track m.value) {
    @if ((countsByMethod().get(m.value) ?? 0) > 0) {
      <p-tag [value]="m.value + ': ' + (countsByMethod().get(m.value) ?? 0)"
        [severity]="methodSeverity(m.value)" [rounded]="true" />
    }
  }
  <ng-container *appHasPermission="'POST /api/recursos'">
    <button pButton type="button" (click)="openCreate()">
      <i pButtonIcon class="pi pi-plus"></i><span pButtonLabel>Nuevo recurso</span>
    </button>
  </ng-container>
</app-page-header>

@if (error()) { <p-message severity="error" styleClass="mb-4 w-full">{{ error() }}</p-message> }

<div class="mb-4 flex gap-2">
  <input pInputText type="search" aria-label="Buscar recursos"
    placeholder="Buscar por path o descripción…"
    [value]="filter()" (input)="filter.set($any($event.target).value)" class="flex-1" />
  <p-select [options]="[{ label: 'Todos', value: null }, ...methods]"
    optionLabel="label" optionValue="value"
    [ngModel]="methodFilter()" (onChange)="methodFilter.set($event.value)"
    placeholder="Método" [fluid]="true" styleClass="w-40" />
</div>

<div class="rounded-xl border border-slate-200 bg-white">
  <p-table [value]="visibleRows()" [loading]="loading()" dataKey="id" tableStyleClass="min-w-4xl">
    <ng-template #header>
      <tr><th>Método</th><th>Ruta</th><th>Descripción</th><th>Estado</th>
        <th class="w-40 text-right">Acciones</th></tr>
    </ng-template>
    <ng-template #body let-r>
      <tr>
        <td><p-tag [value]="r.method" [severity]="methodSeverity(r.method)" [rounded]="true" /></td>
        <td class="font-mono text-xs">{{ r.path }}</td>
        <td class="text-sm text-slate-600">{{ r.description || '—' }}</td>
        <td><app-status-tag [status]="r.status" /></td>
        <td>
          <div class="flex justify-end gap-1">
            <ng-container *appHasPermission="'PATCH /api/recursos/:id'">
              <button pButton text rounded severity="secondary" icon="pi pi-pencil"
                aria-label="Editar recurso" (click)="openEdit(r)"></button>
            </ng-container>
            <ng-container *appHasPermission="'PATCH /api/recursos/:id/deactivate'">
              <button pButton text rounded severity="warn" icon="pi pi-ban"
                aria-label="Baja lógica" (click)="deactivate(r)"></button>
            </ng-container>
            <ng-container *appHasPermission="'DELETE /api/recursos/:id'">
              <button pButton text rounded severity="danger" icon="pi pi-trash"
                aria-label="Eliminar recurso" (click)="remove(r)"></button>
            </ng-container>
          </div>
        </td>
      </tr>
    </ng-template>
    <ng-template #emptymessage>
      <tr><td colspan="5"><app-empty-state icon="pi pi-database" title="Sin recursos"
        message="Crea el primero con «Nuevo recurso»." /></td></tr>
    </ng-template>
  </p-table>
</div>

<p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)"
  [header]="title()" [modal]="true" [draggable]="false" [resizable]="false"
  [dismissableMask]="true" styleClass="w-full max-w-xl mx-4">
  <app-resource-form [resource]="editing()" [saving]="saving()" [resetKey]="resetKey()"
    (saved)="save($event)" (cancelled)="dialogVisible.set(false)" />
</p-dialog>
EOF

cat > src/app/features/admin/resources/resource-list/resource-list.css <<'EOF'
/* Vacío a propósito. */
EOF
```

> Usa `DELETE` con cuidado: **rompe** las filas históricas de `resource_roles` que apunten al `resource`. Para el día a día, prefiere `PATCH /:id/deactivate`.

---

## 10.7 Asignaciones usuario ↔ rol

### 10.7.1 `RoleUserApi`

```bash
mkdir -p src/app/features/admin/role-users
cat > src/app/features/admin/role-users/role-user-api.ts <<'EOF'
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RoleUser, RoleUserPayload } from '../../../core/models/admin.model';

@Injectable({ providedIn: 'root' })
export class RoleUserApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/asignaciones-rol`;

  list(): Observable<RoleUser[]> {
    return this.http.get<{ assignments: RoleUser[] }>(this.base).pipe(map((r) => r.assignments));
  }

  create(payload: RoleUserPayload): Observable<RoleUser> {
    return this.http.post<{ assignment: RoleUser }>(this.base, payload).pipe(map((r) => r.assignment));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  reactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/reactivate`, {});
  }
}
EOF
```

> **No hay `DELETE` físico.** Retirar es baja lógica y reactivar es `PATCH /:id/reactivate`. El `POST` hace **create-or-reactivate** si la fila ya existía inactiva (el índice único `(user_id, role_id)` lo garantiza).

### 10.7.2 `RoleUserList`

```bash
cat > src/app/features/admin/role-users/role-user-list/role-user-list.ts <<'EOF'
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { RoleUser } from '../../../../core/models/admin.model';
import { Role } from '../../../../core/models/role.model';
import { User } from '../../../../core/models/user.model';
import { NotificationService } from '../../../../core/services/notification';
import { toApiMessage } from '../../../../core/utils/api-error';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { RoleApi } from '../../roles/role-api';
import { UserApi } from '../../users/user-api';
import { RoleUserApi } from '../role-user-api';

@Component({
  host: { class: 'block' }, selector: 'app-role-user-list',
  imports: [ButtonModule, DialogModule, EmptyState, FormsModule, HasPermission,
    MessageModule, PageHeader, SelectModule, TableModule, TagModule, TooltipModule],
  templateUrl: './role-user-list.html', styleUrl: './role-user-list.css',
})
export class RoleUserList {
  private readonly api = inject(RoleUserApi);
  private readonly usersApi = inject(UserApi);
  private readonly rolesApi = inject(RoleApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<RoleUser[]>([]);
  readonly users = signal<User[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly dialogVisible = signal(false);
  readonly selectedUser = signal<User | null>(null);
  readonly selectedRole = signal<Role | null>(null);
  readonly canSave = computed(() => !!this.selectedUser() && !!this.selectedRole());

  readonly userName = computed(() => {
    const map = new Map(this.users().map((u) => [u.id, u.username]));
    return (id: number) => map.get(id) ?? `Usuario #${id}`;
  });
  readonly roleName = computed(() => {
    const map = new Map(this.roles().map((r) => [r.id, r.name]));
    return (id: number) => map.get(id) ?? `Rol #${id}`;
  });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    forkJoin({
      assignments: this.api.list(),
      users: this.usersApi.list(),
      roles: this.rolesApi.list(),
    }).subscribe({
      next: ({ assignments, users, roles }) => {
        this.rows.set(assignments); this.users.set(users); this.roles.set(roles);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.rows.set([]); this.error.set(toApiMessage(e)); this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.selectedUser.set(null); this.selectedRole.set(null);
    this.dialogVisible.set(true);
  }

  save(): void {
    const u = this.selectedUser(); const r = this.selectedRole();
    if (!u || !r) return;
    this.api.create({ user_id: u.id, role_id: r.id }).subscribe({
      next: () => { this.dialogVisible.set(false); this.notify.success('Rol asignado'); this.load(); },
      error: (e: unknown) => this.notify.error('No se pudo asignar', toApiMessage(e)),
    });
  }

  deactivate(row: RoleUser): void {
    this.confirmation.confirm({
      header: 'Retirar rol',
      message: `¿Retirar ${this.roleName()(row.role_id)} de ${this.userName()(row.user_id)}?`,
      icon: 'pi pi-exclamation-triangle', acceptLabel: 'Retirar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => this.api.deactivate(row.id).subscribe({
        next: () => { this.notify.warn('Rol retirado'); this.load(); },
        error: (e: unknown) => this.notify.error('No se pudo retirar', toApiMessage(e)),
      }),
    });
  }
}
EOF

cat > src/app/features/admin/role-users/role-user-list/role-user-list.html <<'EOF'
<app-page-header title="Asignaciones usuario ↔ rol" subtitle="Qué roles tiene cada usuario. Retirar es baja lógica.">
  <p-tag [value]="rows().length + ' activas'" severity="info" [rounded]="true" />
  <ng-container *appHasPermission="'POST /api/asignaciones-rol'">
    <button pButton type="button" (click)="openCreate()">
      <i pButtonIcon class="pi pi-plus"></i><span pButtonLabel>Asignar rol</span>
    </button>
  </ng-container>
</app-page-header>

@if (error()) { <p-message severity="error" styleClass="mb-4 w-full">{{ error() }}</p-message> }

<div class="rounded-xl border border-slate-200 bg-white">
  <p-table [value]="rows()" [loading]="loading()" dataKey="id" tableStyleClass="min-w-3xl">
    <ng-template #header>
      <tr><th>Usuario</th><th>Rol</th><th>Estado</th><th class="w-32 text-right">Acciones</th></tr>
    </ng-template>
    <ng-template #body let-row>
      <tr>
        <td>{{ userName()(row.user_id) }}</td>
        <td><p-tag [value]="roleName()(row.role_id)" severity="info" [rounded]="true" /></td>
        <td><p-tag [value]="row.status" severity="secondary" [rounded]="true" /></td>
        <td>
          <div class="flex justify-end">
            <ng-container *appHasPermission="'PATCH /api/asignaciones-rol/:id/deactivate'">
              <button pButton text rounded severity="danger" icon="pi pi-times"
                aria-label="Retirar rol" pTooltip="Retirar"
                (click)="deactivate(row)"></button>
            </ng-container>
          </div>
        </td>
      </tr>
    </ng-template>
    <ng-template #emptymessage>
      <tr><td colspan="4"><app-empty-state icon="pi pi-user-plus" title="Sin asignaciones"
        message="Asigna el primer rol con «Asignar rol»." /></td></tr>
    </ng-template>
  </p-table>
</div>

<p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)"
  header="Asignar rol" [modal]="true" [draggable]="false" [resizable]="false"
  styleClass="w-full max-w-lg mx-4">
  <div class="space-y-4">
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Usuario</label>
      <p-select [fluid]="true" [options]="users()" optionLabel="username"
        [filter]="true" filterBy="username,email"
        [ngModel]="selectedUser()" (ngModelChange)="selectedUser.set($event)" />
    </div>
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Rol</label>
      <p-select [fluid]="true" [options]="roles()" optionLabel="name"
        [filter]="true"
        [ngModel]="selectedRole()" (ngModelChange)="selectedRole.set($event)" />
    </div>
    <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
      <button pButton type="button" severity="secondary" outlined (click)="dialogVisible.set(false)">
        <span pButtonLabel>Cancelar</span>
      </button>
      <button pButton type="button" [disabled]="!canSave()" (click)="save()">
        <i pButtonIcon class="pi pi-check"></i><span pButtonLabel>Asignar</span>
      </button>
    </div>
  </div>
</p-dialog>
EOF

cat > src/app/features/admin/role-users/role-user-list/role-user-list.css <<'EOF'
/* Vacío a propósito. */
EOF
```

> **Advertencia de bloqueo.** Si quitas el **último** `role_user` de un administrador, **nadie podrá administrar el RBAC**. En el laboratorio: crea un **segundo usuario admin**, asígnale el rol `ADMIN`, verifica con “Ver permisos” que tiene `GET /api/usuarios`, y **solo entonces** modifica el primero.

---

## 10.8 Concesiones rol ↔ recurso

### 10.8.1 `ResourceRoleApi`

```bash
mkdir -p src/app/features/admin/resource-roles
cat > src/app/features/admin/resource-roles/resource-role-api.ts <<'EOF'
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ResourceRole, ResourceRolePayload } from '../../../core/models/admin.model';

@Injectable({ providedIn: 'root' })
export class ResourceRoleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/concesiones-rol`;

  list(filters?: { role_id?: number; resource_id?: number }): Observable<ResourceRole[]> {
    let params = new HttpParams();
    if (filters?.role_id) params = params.set('role_id', filters.role_id);
    if (filters?.resource_id) params = params.set('resource_id', filters.resource_id);
    return this.http
      .get<{ grants: ResourceRole[] }>(this.base, { params })
      .pipe(map((r) => r.grants));
  }

  create(payload: ResourceRolePayload): Observable<ResourceRole> {
    return this.http
      .post<{ message: string; grant: ResourceRole }>(this.base, payload)
      .pipe(map((r) => r.grant));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  reactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/reactivate`, {});
  }
}
EOF
```

### 10.8.2 `ResourceRoleList`

```bash
cat > src/app/features/admin/resource-roles/resource-role-list/resource-role-list.ts <<'EOF'
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { ResourceRole } from '../../../../core/models/admin.model';
import { Resource } from '../../../../core/models/resource.model';
import { Role } from '../../../../core/models/role.model';
import { NotificationService } from '../../../../core/services/notification';
import { toApiMessage } from '../../../../core/utils/api-error';
import { methodSeverity } from '../../../../core/utils/http-method';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { ResourceApi } from '../../resources/resource-api';
import { RoleApi } from '../../roles/role-api';
import { ResourceRoleApi } from '../resource-role-api';

@Component({
  host: { class: 'block' }, selector: 'app-resource-role-list',
  imports: [ButtonModule, DialogModule, EmptyState, FormsModule, HasPermission,
    InputTextModule, MessageModule, PageHeader, SelectModule, TableModule,
    TagModule, TooltipModule],
  templateUrl: './resource-role-list.html', styleUrl: './resource-role-list.css',
})
export class ResourceRoleList {
  private readonly api = inject(ResourceRoleApi);
  private readonly rolesApi = inject(RoleApi);
  private readonly resourcesApi = inject(ResourceApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly methodSeverity = methodSeverity;

  readonly rows = signal<ResourceRole[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly resources = signal<Resource[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  readonly dialogVisible = signal(false);
  readonly selectedRole = signal<Role | null>(null);
  readonly selectedResource = signal<Resource | null>(null);
  readonly canSave = computed(() => !!this.selectedRole() && !!this.selectedResource());

  readonly roleName = computed(() => {
    const map = new Map(this.roles().map((r) => [r.id, r.name]));
    return (id: number) => map.get(id) ?? `Rol #${id}`;
  });
  readonly resourceOf = computed(() => {
    const map = new Map(this.resources().map((r) => [r.id, r]));
    return (id: number) => map.get(id);
  });

  readonly visibleRows = computed(() => {
    const q = this.filter().trim().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter((g) => {
      const res = this.resourceOf()(g.resource_id);
      const role = this.roleName()(g.role_id);
      return [role, res?.path, res?.method, res?.description]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    forkJoin({
      grants: this.api.list(),
      roles: this.rolesApi.list(),
      resources: this.resourcesApi.list(),
    }).subscribe({
      next: ({ grants, roles, resources }) => {
        this.rows.set(grants); this.roles.set(roles); this.resources.set(resources);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.rows.set([]); this.error.set(toApiMessage(e)); this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.selectedRole.set(null); this.selectedResource.set(null);
    this.dialogVisible.set(true);
  }

  save(): void {
    const r = this.selectedRole(); const res = this.selectedResource();
    if (!r || !res) return;
    this.api.create({ role_id: r.id, resource_id: res.id }).subscribe({
      next: () => { this.dialogVisible.set(false); this.notify.success('Permiso concedido'); this.load(); },
      error: (e: unknown) => this.notify.error('No se pudo conceder', toApiMessage(e)),
    });
  }

  deactivate(row: ResourceRole): void {
    const res = this.resourceOf()(row.resource_id);
    this.confirmation.confirm({
      header: 'Revocar permiso',
      message: `¿Revocar ${res?.method ?? ''} ${res?.path ?? ''} de ${this.roleName()(row.role_id)}?`,
      icon: 'pi pi-exclamation-triangle', acceptLabel: 'Revocar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.api.deactivate(row.id).subscribe({
        next: () => { this.notify.warn('Permiso revocado'); this.load(); },
        error: (e: unknown) => this.notify.error('No se pudo revocar', toApiMessage(e)),
      }),
    });
  }
}
EOF

cat > src/app/features/admin/resource-roles/resource-role-list/resource-role-list.html <<'EOF'
<app-page-header title="Concesiones rol ↔ recurso" subtitle="Qué puede hacer cada rol. Revocar es baja lógica.">
  <p-tag [value]="rows().length + ' activas'" severity="info" [rounded]="true" />
  <ng-container *appHasPermission="'POST /api/concesiones-rol'">
    <button pButton type="button" (click)="openCreate()">
      <i pButtonIcon class="pi pi-plus"></i><span pButtonLabel>Conceder permiso</span>
    </button>
  </ng-container>
</app-page-header>

@if (error()) { <p-message severity="error" styleClass="mb-4 w-full">{{ error() }}</p-message> }

<div class="mb-4">
  <input pInputText type="search" aria-label="Buscar concesiones"
    placeholder="Buscar por rol, método o ruta…"
    [value]="filter()" (input)="filter.set($any($event.target).value)" class="w-full" />
</div>

<div class="rounded-xl border border-slate-200 bg-white">
  <p-table [value]="visibleRows()" [loading]="loading()" dataKey="id"
    [paginator]="visibleRows().length > 15" [rows]="15" tableStyleClass="min-w-4xl">
    <ng-template #header>
      <tr><th>Rol</th><th>Método</th><th>Ruta</th><th class="w-32 text-right">Acciones</th></tr>
    </ng-template>
    <ng-template #body let-g>
      <tr>
        <td><p-tag [value]="roleName()(g.role_id)" severity="info" [rounded]="true" /></td>
        <td>
          @if (resourceOf()(g.resource_id); as res) {
            <p-tag [value]="res.method" [severity]="methodSeverity(res.method)" [rounded]="true" />
          }
        </td>
        <td class="font-mono text-xs">
          {{ resourceOf()(g.resource_id)?.path || '—' }}
        </td>
        <td>
          <div class="flex justify-end">
            <ng-container *appHasPermission="'PATCH /api/concesiones-rol/:id/deactivate'">
              <button pButton text rounded severity="danger" icon="pi pi-times"
                aria-label="Revocar permiso" pTooltip="Revocar"
                (click)="deactivate(g)"></button>
            </ng-container>
          </div>
        </td>
      </tr>
    </ng-template>
    <ng-template #emptymessage>
      <tr><td colspan="4"><app-empty-state icon="pi pi-key" title="Sin concesiones"
        message="Concede el primer permiso con «Conceder permiso»." /></td></tr>
    </ng-template>
  </p-table>
</div>

<p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)"
  header="Conceder permiso" [modal]="true" [draggable]="false" [resizable]="false"
  styleClass="w-full max-w-xl mx-4">
  <div class="space-y-4">
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Rol</label>
      <p-select [fluid]="true" [options]="roles()" optionLabel="name" [filter]="true"
        [ngModel]="selectedRole()" (ngModelChange)="selectedRole.set($event)" />
    </div>
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Recurso (método + ruta)</label>
      <p-select [fluid]="true" [options]="resources()" [filter]="true"
        filterBy="path,method"
        [ngModel]="selectedResource()" (ngModelChange)="selectedResource.set($event)">
        <ng-template #selectedItem let-res>
          <span class="flex items-center gap-2">
            <p-tag [value]="res.method" [severity]="methodSeverity(res.method)" [rounded]="true" />
            <code class="text-xs">{{ res.path }}</code>
          </span>
        </ng-template>
        <ng-template #item let-res>
          <span class="flex items-center gap-2">
            <p-tag [value]="res.method" [severity]="methodSeverity(res.method)" [rounded]="true" />
            <code class="text-xs">{{ res.path }}</code>
          </span>
        </ng-template>
      </p-select>
    </div>
    <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
      <button pButton type="button" severity="secondary" outlined (click)="dialogVisible.set(false)">
        <span pButtonLabel>Cancelar</span>
      </button>
      <button pButton type="button" [disabled]="!canSave()" (click)="save()">
        <i pButtonIcon class="pi pi-check"></i><span pButtonLabel>Conceder</span>
      </button>
    </div>
  </div>
</p-dialog>
EOF

cat > src/app/features/admin/resource-roles/resource-role-list/resource-role-list.css <<'EOF'
/* Vacío a propósito. */
EOF
```

> ⚠️ `#selectedItem` e `#item` son **templates de PrimeNG 22**, pero se declaran como **variables**. `Select` los busca con `contentChild("selectedItem")`. **Con `pTemplate` se ignoran** y el select muestra `[object Object]` porque el `resource` no tiene un `label` plano. Es el mismo cambio que sufrió `Table` (PARCHE de ISS-03).

---

## 10.9 Rutas y menú

### 10.9.1 Añadir las rutas `/admin/*`

Edita `src/app/app.routes.ts` y añade, **debajo** de las rutas de negocio, las cinco rutas administrativas. Cada una lleva `authOnlyGuard` **antes** de `permissionGuard` y su `data.permission`:

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
      // ...rutas de negocio ya existentes (dashboard, perfil, clientes, tipos-producto, productos, ventas, ventas/nueva, detalle-ventas)...

      // --- Administración RBAC ---
      {
        path: 'admin/usuarios',
        title: 'Usuarios · TextilClean',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/usuarios' },
        loadComponent: () =>
          import('./features/admin/users/user-list/user-list').then(
            (m) => m.UserList,
          ),
      },
      {
        path: 'admin/roles',
        title: 'Roles · TextilClean',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/roles' },
        loadComponent: () =>
          import('./features/admin/roles/role-list/role-list').then(
            (m) => m.RoleList,
          ),
      },
      {
        path: 'admin/recursos',
        title: 'Recursos · TextilClean',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/recursos' },
        loadComponent: () =>
          import(
            './features/admin/resources/resource-list/resource-list'
          ).then((m) => m.ResourceList),
      },
      {
        path: 'admin/asignaciones',
        title: 'Asignaciones · TextilClean',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/asignaciones-rol' },
        loadComponent: () =>
          import(
            './features/admin/role-users/role-user-list/role-user-list'
          ).then((m) => m.RoleUserList),
      },
      {
        path: 'admin/permisos',
        title: 'Concesiones · TextilClean',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/concesiones-rol' },
        loadComponent: () =>
          import(
            './features/admin/resource-roles/resource-role-list/resource-role-list'
          ).then((m) => m.ResourceRoleList),
      },

      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
EOF
```

> **Los comentarios y las rutas de negocio ya existentes** deben preservarse. El bloque anterior **solo añade** las 5 rutas `/admin/*`. Si prefieres, **edita el archivo a mano** y añade el bloque `// --- Administración RBAC ---` sin tocar el resto.

### 10.9.2 Añadir el grupo Seguridad al `NAV`

Edita `src/app/layout/shell/nav.config.ts` para incluir los items del grupo **Seguridad** (que en ISS-09 estaba vacío):

```bash
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

export const NAV: NavGroup[] = [
  {
    label: 'Operación',
    items: [
      { label: 'Panel', icon: 'pi pi-chart-line', routerLink: '/dashboard', permission: 'GET /api/ventas' },
      { label: 'Clientes', icon: 'pi pi-users', routerLink: '/clientes', permission: 'GET /api/clientes' },
      { label: 'Tipos de producto', icon: 'pi pi-tags', routerLink: '/tipos-producto', permission: 'GET /api/tipos-producto' },
      { label: 'Productos', icon: 'pi pi-box', routerLink: '/productos', permission: 'GET /api/productos' },
      { label: 'Ventas', icon: 'pi pi-shopping-cart', routerLink: '/ventas', permission: 'GET /api/ventas' },
      { label: 'Detalle de ventas', icon: 'pi pi-list', routerLink: '/detalle-ventas', permission: 'GET /api/detalle-ventas' },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { label: 'Mi perfil', icon: 'pi pi-user', routerLink: '/perfil' },
    ],
  },
  {
    label: 'Seguridad',
    authOnly: true,
    items: [
      { label: 'Usuarios', icon: 'pi pi-id-card', routerLink: '/admin/usuarios', permission: 'GET /api/usuarios' },
      { label: 'Roles', icon: 'pi pi-shield', routerLink: '/admin/roles', permission: 'GET /api/roles' },
      { label: 'Recursos', icon: 'pi pi-database', routerLink: '/admin/recursos', permission: 'GET /api/recursos' },
      { label: 'Asignaciones', icon: 'pi pi-link', routerLink: '/admin/asignaciones', permission: 'GET /api/asignaciones-rol' },
      { label: 'Concesiones', icon: 'pi pi-key', routerLink: '/admin/permisos', permission: 'GET /api/concesiones-rol' },
    ],
  },
];
EOF
```

> El `Shell.navGroups()` (ISS-09) **ya filtra** cada grupo: `authOnly` desaparece si `authEnabled` es `false`, y cada item desaparece si no tiene `permission` o si `canPermission(permission)` es `false`.

---

## 10.10 Flujo de trabajo recomendado

Para conceder un permiso nuevo:

1. **Recursos** → confirmar que existe el par `(method, path)` (el seeder deja los 58 del catálogo).
2. **Concesiones** → rol `SELLER` + resource `POST /api/ventas`.
3. **Usuarios** → “Ver permisos” de `seller` para confirmar.
4. **Cerrar sesión** y entrar como `seller`.
5. Pulsar **Actualizar permisos** en el menú de usuario.
6. La acción debe quedar habilitada **sin reiniciar el backend**: la matriz se consulta en cada petición.

> El **menú solo conoce las rutas definidas en `NAV`**. Crear un `Resource` **no crea una pantalla nueva**; solo habilita una **ruta existente**.

---

## Verificación del ISS

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026

# 1. Servicios existen
ls src/app/features/admin/users/user-api.ts \
   src/app/features/admin/roles/role-api.ts \
   src/app/features/admin/resources/resource-api.ts \
   src/app/features/admin/role-users/role-user-api.ts \
   src/app/features/admin/resource-roles/resource-role-api.ts

# 2. Formularios existen
ls src/app/features/admin/users/user-form/ \
   src/app/features/admin/roles/role-form/ \
   src/app/features/admin/resources/resource-form/

# 3. User form NO envía password ni status en PATCH
grep -n "if (!this.user())" src/app/features/admin/users/user-form/user-form.ts

# 4. Resource form valida path con regex
grep -n "Validators.pattern" src/app/features/admin/resources/resource-form/resource-form.ts

# 5. Listas usan HasPermission
grep -rln "HasPermission" src/app/features/admin/*/*/*.ts

# 6. Rutas admin con authOnlyGuard + permissionGuard
grep -n "admin/.*authOnlyGuard" src/app/app.routes.ts

# 7. NAV incluye Seguridad
grep -n "Seguridad\|admin/" src/app/layout/shell/nav.config.ts

# 8. Pruebas y build
npm test -- --watch=false
ng build
```

### Comprobación de la cadena completa (con `curl`)

```bash
BASE=http://localhost:4000

# 1. Login admin
TOKEN=$(curl -s -X POST $BASE/api/sesion/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin123!"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# 2. Permisos efectivos de seller (id 2)
curl -s $BASE/api/usuarios/2/permisos -H "Authorization: Bearer $TOKEN"

# 3. Matriz actual (ids de ejemplo: rol SELLER = 2)
curl -s "$BASE/api/concesiones-rol?role_id=2" -H "Authorization: Bearer $TOKEN"

# 4. Conceder un recurso al rol (resource_id 26 = GET /api/usuarios)
curl -s -X POST $BASE/api/concesiones-rol \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role_id":2,"resource_id":26}'

# 5. Repetir el paso 2: debe incluir GET /api/usuarios con role_name SELLER

# 6. Revocar (baja lógica)
GRANT=$(curl -s "$BASE/api/concesiones-rol?role_id=2" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
curl -s -X PATCH "$BASE/api/concesiones-rol/$GRANT/deactivate" \
  -H "Authorization: Bearer $TOKEN"
```

### Comprobación funcional en la UI

Con backend en `AUTH_ENABLED=true` y frontend en `requireAuth: true`:

| Comprobación | Resultado esperado |
|---|---|
| **Login admin** | Menú muestra **Operación + Cuenta + Seguridad** |
| **Login seller** | Menú muestra **Operación reducida + Cuenta**; **no** aparece Seguridad |
| Seller por URL a `/admin/usuarios` | Redirige a `/forbidden` con `GET /api/usuarios` |
| Admin crea usuario | Password y estado visibles; `POST /api/usuarios` los envía |
| Admin edita usuario | Password y estado **ocultos**; `PATCH /api/usuarios/:id` no los envía |
| Admin “Ver permisos” de seller | Diálogo con roles y filas `(method, path)` |
| Admin elimina su propio usuario | Botón **deshabilitado** (`isSelf`) |
| Admin crea rol | `name` se guarda en **MAYÚSCULAS** |
| Admin crea recurso `/api/foo` | Validación: debe empezar por `/` |
| Admin concede `POST /api/ventas` a SELLER | Seller, tras “Actualizar permisos”, ve “Nueva venta” sin recargar |
| Seller escribe `/admin/roles` | `/forbidden` con `GET /api/roles` |

---

## Correspondencia con el código

Archivos que **crea o reemplaza** este ISS:

- `src/app/core/utils/http-method.ts` *(nuevo)*
- `src/app/core/models/admin.model.ts` *(nuevo)*
- `src/app/features/admin/users/user-api.ts` *(nuevo)*
- `src/app/features/admin/users/user-form/` (`.ts .html .css`) *(reemplaza)*
- `src/app/features/admin/users/user-list/` (`.ts .html .css`) *(reemplaza)*
- `src/app/features/admin/roles/role-api.ts` *(nuevo)*
- `src/app/features/admin/roles/role-form/` (`.ts .html .css`) *(reemplaza)*
- `src/app/features/admin/roles/role-list/` (`.ts .html .css`) *(reemplaza)*
- `src/app/features/admin/resources/resource-api.ts` *(nuevo)*
- `src/app/features/admin/resources/resource-form/` (`.ts .html .css`) *(reemplaza)*
- `src/app/features/admin/resources/resource-list/` (`.ts .html .css`) *(reemplaza)*
- `src/app/features/admin/role-users/role-user-api.ts` *(nuevo)*
- `src/app/features/admin/role-users/role-user-list/` (`.ts .html .css`) *(reemplaza)*
- `src/app/features/admin/resource-roles/resource-role-api.ts` *(nuevo)*
- `src/app/features/admin/resource-roles/resource-role-list/` (`.ts .html .css`) *(reemplaza)*
- `src/app/app.routes.ts` *(edita: añade las 5 rutas `/admin/*` con `authOnlyGuard` + `permissionGuard` + `data.permission`)*
- `src/app/layout/shell/nav.config.ts` *(edita: rellena el grupo `Seguridad` con los 5 items)*

Archivos de **ISS-02 → ISS-09 que no se tocan**: `session-store.ts`, `auth.ts`, `auth-interceptor.ts`, `error-interceptor.ts`, guards (`auth`, `guest`, `permission`, `auth-only`), `has-permission.ts`, `shell.ts`, `shell.html`, todas las pantallas de negocio (clientes, tipos, productos, ventas, detalle, dashboard), `login/`, `profile/`, `forbidden/`.

---

## Notas del docente

- **Regla de oro**: `role_users active → roles active → resource_roles active → resources active`. Si **cualquier** eslabón está inactivo, `403`. La UI replica esta lógica con `SessionStore.canPermission()`.
- **`password` y `status` solo en el alta.** `PATCH /api/usuarios/:id` no los acepta; el backend podría **rehashear** la contraseña sin verificar la actual. El estado se cambia con `/deactivate`.
- **Cambio de contraseña** (`PATCH /api/usuarios/:id/password`) exige `current_password` del **propio usuario** (defensa en profundidad). **No** es “admin resetea a otro”. El formulario de administración **no la ofrece**.
- **Auto-bloqueo**: `isSelf(user)` deshabilita “Eliminar” sobre el propio usuario. En **Asignaciones**, no quites el **último** `role_user` del `ADMIN`: créate un segundo admin antes de modificar el primero.
- **Roles en MAYÚSCULAS.** El backend normaliza `name` a `ADMIN`, `SELLER`, `BUYER`. **El nombre del rol no autoriza nada**: un `ADMIN` sin filas activas en `resource_roles` **no puede ejecutar ninguna operación**.
- **`path` debe empezar por `/`.** Usa `:id` para parámetros (`/api/clientes/:id`, `/api/clientes/:id/deactivate`). El backend normaliza verbo a mayúsculas y ruta (sin barra final, sin `//`).
- **`DELETE /api/recursos/:id` existe, pero es peligroso**: rompe las filas históricas de `resource_roles`. Para el día a día, prefiere `PATCH /:id/deactivate`.
- **Pivotes** (`asignaciones-rol`, `concesiones-rol`) **no tienen `DELETE` físico**: retirar es baja lógica (`/deactivate`) y reactivar es `PATCH /:id/reactivate` (auditoría). El `POST` hace **create-or-reactivate** si la fila existía inactiva.
- **`#selectedItem` / `#item` en `p-select`** son **templates** (no `pTemplate`). Con `pTemplate` se ignoran y el select muestra `[object Object]`.
- **NAV solo conoce rutas definidas.** Crear un `Resource` **no crea una pantalla nueva**: solo habilita una ruta existente.

---

## Navegación

⬅️ **Anterior:** ISS-09 — Guards y RBAC estructural en la UI
⬆️ **Ruta:** Frontend-Express · **Fase II · Bloque 3 de 3 (administración)**
➡️ **Siguiente:** ISS-11 — Validación del build, calidad y resolución de problemas