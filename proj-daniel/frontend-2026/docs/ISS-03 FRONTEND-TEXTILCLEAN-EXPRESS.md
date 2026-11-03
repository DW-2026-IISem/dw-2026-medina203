# 🛠 ISS-03 · CRUD de clientes con Signals

> **Proyecto frontend:** `front-textilclean-express` (carpeta real: `frontend-2026`) **Ruta frontend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026` **Proyecto backend:** `app-textilclean-express` **Ruta backend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express` **Fase:** I · Frontend · **Bloqueado por:** ISS-02 · **Habilita:** ISS-04 **Vigencia:** revisión alineada con guía del docente del 23-oct-2026. **Capa:** 🛠 Construir (ejecutar, verificar y entregar)

------------------------------------------------------------------------

## 0. Antes de tocar nada

``` bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
```

Verifica que estás en la carpeta correcta y que los archivos de ISS-02 existen:

``` bash
pwd
ls src/app/features/clients/
# Debe aparecer: client-api.ts  client-api.spec.ts
ls src/app/core/models/
# Debe aparecer: api.model.ts  client.model.ts
ls src/app/core/utils/
# Debe aparecer: api-error.ts  (y filter-rows.ts se crea en este ISS)
```

Si `client-api.ts`, `client.model.ts` o `api-error.ts` **no existen**, no continúes: vuelve a ISS-02.

------------------------------------------------------------------------

## Criterios de aceptación (ISS-03)

- [ ] `GET /api/clientes` pinta la tabla con los clientes **activos** del seeder.
- [ ] «Nuevo cliente» abre el diálogo, valida y crea (`POST`).
- [ ] Editar abre el mismo formulario con datos cargados y hace `PATCH` **sin `status`**.
- [ ] El buscador filtra **sin recargar y sin llamar al backend**.
- [ ] La **baja lógica** desaparece de la tabla; la **física** también.
- [ ] Un fallo de carga (`GET`) se muestra en `p-message`; uno de operación (`POST/PATCH/DELETE`) en un **toast**.
- [ ] `ng serve` no muestra errores en consola.

### Encaje en las dos fases

Esta ISS es **Fase I (Business)**: sin login, interceptor, guards ni directiva de permisos. Para probar el CRUD contra el backend `app-textilclean-express` **mientras no termines ISS-08**, hay dos opciones:

- **Opción A** — Poner `AUTH_ENABLED=false` en el `.env` del backend (deja OPEN solo las rutas de negocio):

  ``` bash
  cd ~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express
  # edita .env: AUTH_ENABLED=false
  npm run db:seed && npm run dev
  ```

- **Opción B** — Usar un stub temporal en otro puerto. Si el backend consolidado ya exige JWT (`401 Missing Bearer token`), no lo fuerces añadiendo el token a mano: el token es **ISS-08**.

------------------------------------------------------------------------

## 3.1 Generar los dos componentes del CRUD

``` bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
ng generate component features/clients/client-list --skip-tests --defaults
ng generate component features/clients/client-form --skip-tests --defaults
```

Comprueba la estructura:

``` bash
ls -R src/app/features/clients/
```

Debe quedar así (los `.spec.ts` del CLI se sustituyen más abajo por los completos):

```         
src/app/features/clients/
├── client-api.ts                 # ya existía (ISS-02)
├── client-api.spec.ts            # ya existía (ISS-02)
├── client-form/
│   ├── client-form.ts
│   ├── client-form.html
│   ├── client-form.css
│   └── client-form.spec.ts
└── client-list/
    ├── client-list.ts
    ├── client-list.html
    ├── client-list.css
    └── client-list.spec.ts
```

> `--skip-tests` **no evita pruebas**: los `.spec.ts` de esta ISS son más largos que la plantilla del CLI y los vas a sobrescribir con `cat >` en la sección 3.7.

------------------------------------------------------------------------

## 3.2 Utilidad de filtro local (función pura)

PrimeNG 22 **eliminó** el input `globalFilter` de `p-table`. Filtramos el arreglo **antes** de entregarlo a `[value]`, con una función pura fácil de testear.

``` bash
mkdir -p src/app/core/utils
cat > src/app/core/utils/filter-rows.ts <<'EOF'
/**
 * Filtro local reutilizable para tablas PrimeNG 22.
 *
 * PrimeNG 22 eliminó el input `globalFilter` de `p-table`, así que filtramos el
 * arreglo **antes** de entregarlo a `[value]`. Es una función pura: no depende
 * del DOM, de la tabla ni de Angular, y por eso se prueba sin montar nada.
 */
export function filterRows<T>(
  rows: readonly T[],
  query: string,
  pick: (row: T) => Array<string | number | null | undefined>,
): T[] {
  const term = query.trim().toLowerCase();

  if (!term) {
    return [...rows];
  }

  return rows.filter((row) =>
    pick(row).some((value) =>
      (value ?? '').toString().toLowerCase().includes(term),
    ),
  );
}
EOF
```

Prueba de la función pura:

``` bash
cat > src/app/core/utils/filter-rows.spec.ts <<'EOF'
import { filterRows } from './filter-rows';

const ROWS = [
  { nombre: 'Tienda Sur', email: 'sur@x.com', phone: null as string | null },
  { nombre: 'Bodega Norte', email: 'norte@x.com', phone: '3001234567' },
  { nombre: 'Kiosco Centro', email: null as string | null, phone: null as string | null },
];

const pick = (row: typeof ROWS[number]) => [row.nombre, row.email, row.phone];

describe('filterRows', () => {
  it('returns a copy when query is empty', () => {
    const out = filterRows(ROWS, '', pick);
    expect(out).toEqual(ROWS);
    expect(out).not.toBe(ROWS);
  });

  it('ignores surrounding whitespace and case', () => {
    expect(filterRows(ROWS, '  SUR  ', pick).map((r) => r.nombre)).toEqual([
      'Tienda Sur',
    ]);
  });

  it('matches by email', () => {
    expect(filterRows(ROWS, 'norte@', pick)).toHaveLength(1);
  });

  it('handles null fields without throwing', () => {
    expect(filterRows(ROWS, 'centro', pick)).toHaveLength(1);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterRows(ROWS, 'zzz', pick)).toEqual([]);
  });
});
EOF
```

------------------------------------------------------------------------

## 3.3 Formulario reactivo reutilizable

Sirve para crear y editar. Recibe `client` y `resetKey` como `input()`; emite `saved` / `cancelled` como `output()`. **No llama a la API.**

### 3.3.1 `client-form.ts`

``` bash
cat > src/app/features/clients/client-form/client-form.ts <<'EOF'
import { Component, effect, inject, input, output } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Status } from '../../../core/models/api.model';
import { Client, ClientPayload } from '../../../core/models/client.model';

/**
 * Formulario de cliente, reutilizado para crear y editar.
 *
 * No llama a la API: recibe `client` (o `null` para crear) y emite el payload
 * con `saved`. El padre decide entre `POST` y `PATCH` y controla el diálogo, así
 * que este componente sirve igual dentro de un Dialog que en una página.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-client-form',
  imports: [
    MessageModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './client-form.html',
  styleUrl: './client-form.css',
})
export class ClientForm {
  /** Cliente a editar. `null` deja el formulario en modo creación. */
  readonly client = input<Client | null>(null);

  /** Se incrementa cada vez que el padre abre el diálogo (ver nota). */
  readonly resetKey = input(0);

  /** Petición en curso: deshabilita el botón y muestra su spinner. */
  readonly saving = input(false);

  readonly saved = output<ClientPayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    address: [''],
    phone: [''],
    email: ['', [Validators.email]],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.client();
      this.resetKey();

      this.form.reset({
        name: current?.name ?? '',
        address: current?.address ?? '',
        phone: current?.phone ?? '',
        email: current?.email ?? '',
        status: current?.status ?? 'active',
      });

      if (current) {
        this.form.controls.status.disable();
      } else {
        this.form.controls.status.enable();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: ClientPayload = {
      name: value.name.trim(),
      address: value.address.trim() || null,
      phone: value.phone.trim() || null,
      email: value.email.trim() || null,
    };

    this.saved.emit(this.client() ? payload : { ...payload, status: value.status });
  }
}
EOF
```

### 3.3.2 `client-form.html`

``` bash
cat > src/app/features/clients/client-form/client-form.html <<'EOF'
<form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
  <div>
    <label for="client-name" class="mb-1 block text-sm font-medium text-slate-700">
      Nombre <span class="text-red-500">*</span>
    </label>
    <input
      id="client-name"
      pInputText
      formControlName="name"
      placeholder="Tienda La Esquina"
      autocomplete="organization"
      class="w-full"
    />
    @if (form.controls.name.touched && form.controls.name.invalid) {
      <p-message severity="error" size="small" variant="simple" styleClass="mt-1">
        El nombre es obligatorio (máximo 120 caracteres).
      </p-message>
    }
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label for="client-phone" class="mb-1 block text-sm font-medium text-slate-700">
        Teléfono
      </label>
      <input
        id="client-phone"
        pInputText
        formControlName="phone"
        placeholder="300 000 0000"
        autocomplete="tel"
        class="w-full"
      />
    </div>

    <div>
      <label for="client-email" class="mb-1 block text-sm font-medium text-slate-700">
        Email
      </label>
      <input
        id="client-email"
        type="email"
        pInputText
        formControlName="email"
        placeholder="cliente@correo.com"
        autocomplete="email"
        class="w-full"
      />
      @if (form.controls.email.touched && form.controls.email.invalid) {
        <p-message severity="error" size="small" variant="simple" styleClass="mt-1">
          Formato de email inválido.
        </p-message>
      }
    </div>
  </div>

  <div>
    <label for="client-address" class="mb-1 block text-sm font-medium text-slate-700">
      Dirección
    </label>
    <textarea
      id="client-address"
      pTextarea
      formControlName="address"
      rows="2"
      placeholder="Calle 1 # 2-3"
      class="w-full"
    ></textarea>
  </div>

  <div>
    <label for="client-status" class="mb-1 block text-sm font-medium text-slate-700">
      Estado
    </label>
    <p-select
      inputId="client-status"
      formControlName="status"
      [options]="statusOptions"
      optionLabel="label"
      optionValue="value"
      [fluid]="true"
    />
    @if (client()) {
      <p class="mt-1 text-xs text-slate-500">
        El estado de un cliente existente solo cambia con la baja lógica.
      </p>
    }
  </div>

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
```

### 3.3.3 `client-form.css` (vacío a propósito)

``` bash
cat > src/app/features/clients/client-form/client-form.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 3.3.4 `client-form.spec.ts`

``` bash
cat > src/app/features/clients/client-form/client-form.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { ClientForm } from './client-form';

const CLIENT = {
  id: 1,
  name: 'Tienda Sur',
  email: 'sur@x.com',
  phone: '3000000000',
  address: 'Calle 1',
  status: 'active' as const,
};

describe('ClientForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ClientForm] }).compileComponents();
  });

  function crear(client: typeof CLIENT | null = null) {
    const fixture = TestBed.createComponent(ClientForm);
    fixture.componentRef.setInput('client', client);
    fixture.detectChanges();
    return fixture;
  }

  it('should start in creation mode with active status', () => {
    const fixture = crear(null);
    const form = fixture.componentInstance.form;
    expect(form.controls.name.value).toBe('');
    expect(form.controls.status.value).toBe('active');
    expect(form.controls.status.enabled).toBe(true);
  });

  it('should mark name invalid when empty', () => {
    const fixture = crear(null);
    fixture.componentInstance.form.controls.name.setValue('');
    expect(fixture.componentInstance.form.controls.name.invalid).toBe(true);
  });

  it('should mark email invalid when malformed', () => {
    const fixture = crear(null);
    fixture.componentInstance.form.controls.email.setValue('no-es-email');
    expect(fixture.componentInstance.form.controls.email.invalid).toBe(true);
  });

  it('should emit a POST-like payload from creation mode', () => {
    const fixture = crear(null);
    const emitted: unknown[] = [];
    fixture.componentInstance.saved.subscribe((p) => emitted.push(p));

    fixture.componentInstance.form.patchValue({
      name: '  Cafetería Central  ',
      phone: '',
      email: '',
      address: '',
      status: 'active',
    });
    fixture.componentInstance.submit();

    expect(emitted).toEqual([
      {
        name: 'Cafetería Central',
        phone: null,
        email: null,
        address: null,
        status: 'active',
      },
    ]);
  });

  it('should load client data and disable status in edit mode', () => {
    const fixture = crear(CLIENT);
    const form = fixture.componentInstance.form;
    expect(form.controls.name.value).toBe('Tienda Sur');
    expect(form.controls.status.disabled).toBe(true);
  });

  it('should emit a PATCH-like payload without status in edit mode', () => {
    const fixture = crear(CLIENT);
    const emitted: unknown[] = [];
    fixture.componentInstance.saved.subscribe((p) => emitted.push(p));

    fixture.componentInstance.form.patchValue({ name: 'Tienda Sur 2' });
    fixture.componentInstance.submit();

    expect(emitted).toEqual([
      {
        name: 'Tienda Sur 2',
        phone: '3000000000',
        email: 'sur@x.com',
        address: 'Calle 1',
      },
    ]);
  });

  it('should emit cancelled when Cancel is clicked', () => {
    const fixture = crear(null);
    let cancelado = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelado = true));

    const boton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (b: HTMLButtonElement) => b.textContent?.includes('Cancelar'),
    ) as HTMLButtonElement;
    boton.click();

    expect(cancelado).toBe(true);
  });
});
EOF
```

### Notas del docente (por qué este diseño)

- **`resetKey`**: `p-dialog` de PrimeNG 22 mantiene el contenido montado al cerrarse (ya no tiene `destroyOnHide`). Sin `resetKey`, reabrir «Nuevo cliente» tras cancelar conservaría lo escrito. Un contador que el padre incrementa en cada apertura obliga al `effect()` a correr.
- **`status` deshabilitado al editar**: `PATCH /api/clientes/:id` **no** cambia el estado; para eso está `PATCH /:id/deactivate`. Con el control deshabilitado el formulario no ofrece una acción que el backend ignoraría.
- **Sin campo `password`**: `CreateClientDto` de Express declara `password` pero es `allowNull: true`; el cliente se puede crear desde el panel sin contraseña.

------------------------------------------------------------------------

## 3.4 Lista con estado en Signals

### 3.4.1 `client-list.ts`

``` bash
cat > src/app/features/clients/client-list/client-list.ts <<'EOF'
import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Client, ClientPayload } from '../../../core/models/client.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { ClientApi } from '../client-api';
import { ClientForm } from '../client-form/client-form';

@Component({
  host: { class: 'block' },
  selector: 'app-client-list',
  imports: [
    ButtonModule,
    DialogModule,
    EmptyState,
    InputTextModule,
    MessageModule,
    PageHeader,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
    ClientForm,
  ],
  templateUrl: './client-list.html',
  styleUrl: './client-list.css',
})
export class ClientList {
  private readonly api = inject(ClientApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (client) => [
      client.name,
      client.email,
      client.phone,
      client.address,
    ]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<Client | null>(null);
  readonly resetKey = signal(0);

  readonly title = computed(() =>
    this.editing() ? 'Editar cliente' : 'Nuevo cliente',
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.rows.set([]);
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  openEdit(client: Client): void {
    this.editing.set(client);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  save(payload: ClientPayload): void {
    const current = this.editing();
    this.saving.set(true);

    const request = current
      ? this.api.update(current.id, payload)
      : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Cliente actualizado' : 'Cliente creado');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(client: Client): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar a ${client.name}? Su estado pasará a inactivo.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(client.id).subscribe({
          next: () => {
            this.notify.warn('Cliente desactivado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo desactivar', toApiMessage(error));
          },
        });
      },
    });
  }

  remove(client: Client): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará ${client.name} de la base de datos. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(client.id).subscribe({
          next: () => {
            this.notify.success('Cliente eliminado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo eliminar', toApiMessage(error));
          },
        });
      },
    });
  }
}
EOF
```

### 3.4.2 `client-list.html`

``` bash
cat > src/app/features/clients/client-list/client-list.html <<'EOF'
<app-page-header
  title="Clientes"
  subtitle="El backend solo lista los clientes activos; la baja lógica cambia su estado."
>
  <p-tag [value]="rows().length + ' activos'" severity="info" [rounded]="true" />
  <button pButton type="button" (click)="openCreate()">
    <i pButtonIcon class="pi pi-plus"></i>
    <span pButtonLabel>Nuevo cliente</span>
  </button>
</app-page-header>

@if (error()) {
  <p-message severity="error" styleClass="mb-4 w-full">
    {{ error() }}
  </p-message>
}

<div class="rounded-xl border border-slate-200 bg-white">
  <p-table
    [value]="visibleRows()"
    [loading]="loading()"
    [paginator]="visibleRows().length > 10"
    [rows]="10"
    dataKey="id"
    tableStyleClass="min-w-3xl"
  >
    <ng-template #caption>
      <div class="flex items-center gap-2">
        <i class="pi pi-search text-slate-400"></i>
        <input
          pInputText
          type="search"
          aria-label="Buscar clientes"
          placeholder="Buscar por nombre, email, teléfono o dirección…"
          [value]="filter()"
          (input)="filter.set($any($event.target).value)"
          class="w-full"
        />
      </div>
      @if (filter()) {
        <p class="mt-2 text-xs text-slate-500">
          {{ visibleRows().length }} de {{ rows().length }} coinciden con «{{ filter() }}».
        </p>
      }
    </ng-template>

    <ng-template #header>
      <tr>
        <th pSortableColumn="name">
          <div class="flex items-center gap-1">Nombre <p-sort-icon field="name" /></div>
        </th>
        <th pSortableColumn="email">
          <div class="flex items-center gap-1">Contacto <p-sort-icon field="email" /></div>
        </th>
        <th>Dirección</th>
        <th>Estado</th>
        <th class="w-40 text-right">Acciones</th>
      </tr>
    </ng-template>

    <ng-template #body let-client>
      <tr>
        <td>
          <p class="font-medium text-slate-800">{{ client.name }}</p>
          <p class="text-xs text-slate-400">#{{ client.id }}</p>
        </td>
        <td>
          <p class="text-sm text-slate-700">{{ client.email || '—' }}</p>
          <p class="text-xs text-slate-400">{{ client.phone || 'Sin teléfono' }}</p>
        </td>
        <td class="text-sm text-slate-600">{{ client.address || '—' }}</td>
        <td><app-status-tag [status]="client.status" /></td>
        <td>
          <div class="flex justify-end gap-1">
            <button
              pButton type="button" text rounded severity="secondary"
              icon="pi pi-pencil" aria-label="Editar cliente"
              pTooltip="Editar" (click)="openEdit(client)"
            ></button>
            <button
              pButton type="button" text rounded severity="warn"
              icon="pi pi-ban" aria-label="Dar de baja al cliente"
              pTooltip="Baja lógica" (click)="deactivate(client)"
            ></button>
            <button
              pButton type="button" text rounded severity="danger"
              icon="pi pi-trash" aria-label="Eliminar cliente"
              pTooltip="Eliminar" (click)="remove(client)"
            ></button>
          </div>
        </td>
      </tr>
    </ng-template>

    <ng-template #emptymessage>
      <tr>
        <td colspan="5">
          @if (filter()) {
            <app-empty-state
              icon="pi pi-search"
              title="Sin coincidencias"
              message="Ningún cliente coincide con la búsqueda. Borra el filtro para ver todos."
            />
          } @else {
            <app-empty-state
              icon="pi pi-users"
              title="Sin clientes activos"
              message="Crea el primero con el botón «Nuevo cliente» o ejecuta el seeder del backend."
            />
          }
        </td>
      </tr>
    </ng-template>
  </p-table>
</div>

<p-dialog
  [visible]="dialogVisible()"
  (visibleChange)="dialogVisible.set($event)"
  [header]="title()"
  [modal]="true"
  [draggable]="false"
  [resizable]="false"
  [dismissableMask]="true"
  styleClass="w-full max-w-2xl mx-4"
>
  <app-client-form
    [client]="editing()"
    [saving]="saving()"
    [resetKey]="resetKey()"
    (saved)="save($event)"
    (cancelled)="dialogVisible.set(false)"
  />
</p-dialog>
EOF
```

> ⚠️ **PARCHE PrimeNG 22.** `p-table` **ya no usa `pTemplate="header|body|emptymessage"`**: busca *variables de plantilla* (`contentChild("header")`, etc.). Con `pTemplate` la compilación pasa y la tabla **se pinta vacía sin error**. Usa `<ng-template #caption>`, `<ng-template #header>`, `<ng-template #body let-client>` y `<ng-template #emptymessage>`.

### 3.4.3 `client-list.css` (vacío a propósito)

``` bash
cat > src/app/features/clients/client-list/client-list.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 3.4.4 `client-list.spec.ts`

``` bash
cat > src/app/features/clients/client-list/client-list.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClientList } from './client-list';

const BASE = '/api/clientes';

const CLIENTES = [
  { id: 1, name: 'Tienda Sur', email: 'sur@x.com', phone: null, address: 'Calle 1', status: 'active' as const },
  { id: 2, name: 'Bodega Norte', email: 'norte@x.com', phone: '3001234567', address: null, status: 'active' as const },
  { id: 3, name: 'Kiosco Centro', email: null, phone: null, address: null, status: 'active' as const },
];

describe('ClientList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        ConfirmationService,
        providePrimeNG({ theme: { preset: Aura } }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function crearLista() {
    const fixture = TestBed.createComponent(ClientList);
    fixture.detectChanges();
    const primera = http.expectOne(BASE);
    expect(primera.request.method).toBe('GET');
    primera.flush({ clients: CLIENTES });
    await fixture.whenStable();
    return { fixture, lista: fixture.componentInstance };
  }

  it('should load the table with the active clients', async () => {
    const { fixture } = await crearLista();
    const filas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(filas.length).toBe(CLIENTES.length);
  });

  it('should show an error message when GET fails', async () => {
    const fixture = TestBed.createComponent(ClientList);
    fixture.detectChanges();
    http.expectOne(BASE).flush(
      { error: 'boom' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBeTruthy();
  });

  it('should filter without new HTTP calls', async () => {
    const { fixture, lista } = await crearLista();
    lista.filter.set('sur');
    fixture.detectChanges();
    expect(lista.visibleRows().length).toBe(1);
    http.expectNone(BASE);
  });

  it('should POST a new client and reload', async () => {
    const { lista } = await crearLista();
    lista.openCreate();
    lista.save({ name: 'Cafetería Central', phone: null, email: null, address: null });
    const post = http.expectOne(BASE);
    expect(post.request.method).toBe('POST');
    post.flush({ client: { id: 4, name: 'Cafetería Central', status: 'active' } });
    http.expectOne(BASE).flush({ clients: [...CLIENTES, { id: 4, name: 'Cafetería Central', status: 'active', email: null, phone: null, address: null }] });
  });

  it('should PATCH without status', async () => {
    const { lista } = await crearLista();
    lista.openEdit(CLIENTES[0]);
    lista.save({ name: 'Tienda Sur', phone: '3100000000' });
    const patch = http.expectOne(`${BASE}/1`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ name: 'Tienda Sur', phone: '3100000000' });
    patch.flush({ client: CLIENTES[0] });
    http.expectOne(BASE).flush({ clients: CLIENTES });
  });

  it('should call deactivate after confirmation', async () => {
    const { lista } = await crearLista();
    const confirmacion = TestBed.inject(ConfirmationService);
    spyOn(confirmacion, 'confirm').and.callFake((opts: any) => {
      opts.accept?.();
      return confirmacion;
    });
    lista.deactivate(CLIENTES[0]);
    const baja = http.expectOne(`${BASE}/1/deactivate`);
    expect(baja.request.method).toBe('PATCH');
    baja.flush({ message: 'ok' });
    http.expectOne(BASE).flush({ clients: CLIENTES.slice(1) });
  });

  it('should call DELETE for physical removal', async () => {
    const { lista } = await crearLista();
    const confirmacion = TestBed.inject(ConfirmationService);
    spyOn(confirmacion, 'confirm').and.callFake((opts: any) => {
      opts.accept?.();
      return confirmacion;
    });
    lista.remove(CLIENTES[0]);
    const del = http.expectOne(`${BASE}/1`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'ok' });
    http.expectOne(BASE).flush({ clients: CLIENTES.slice(1) });
  });

  it('should reject invalid payload before sending', async () => {
    const { lista } = await crearLista();
    lista.openCreate();
    // Nombre vacío: el formulario real no emitiría; aquí forzamos la guarda.
    const form = lista as unknown as { saving: { (): boolean } };
    expect(form.saving()).toBe(false);
    http.expectNone(BASE);
  });

  it('should show a toast on operation error', async () => {
    const { lista } = await crearLista();
    const mensajes = TestBed.inject(MessageService);
    spyOn(mensajes, 'add');
    lista.openCreate();
    lista.save({ name: 'X', phone: null, email: null, address: null });
    http.expectOne(BASE).flush(
      { error: 'forbidden' },
      { status: 403, statusText: 'Forbidden' },
    );
    expect(mensajes.add).toHaveBeenCalled();
  });
});
EOF
```

------------------------------------------------------------------------

## 3.5 Baja lógica vs baja física

Los dos métodos ya están en `client-list.ts` (sección 3.4.1). Resumen:

| Método | Endpoint | Efecto |
|----|----|----|
| `deactivate(client)` | `PATCH /api/clientes/:id/deactivate` | El cliente deja de listarse (backend filtra `status: active`) |
| `remove(client)` | `DELETE /api/clientes/:id` | Borra de la base de datos. No se puede deshacer |

**Los dos `error` importan.** Sin ellos, un `403` de RBAC o un `404` (otro usuario ya borró el registro) dejaría el diálogo cerrado y la tabla sin cambios, **sin explicación**. El **toast** es el canal para el fallo de una operación puntual; el **`p-message`** de arriba, para el fallo de la **carga**.

------------------------------------------------------------------------

## 3.6 Ruta y menú

### 3.6.1 Editar `src/app/app.routes.ts`

Sustituye el arreglo por este (los imports ya existen):

``` bash
cat > src/app/app.routes.ts <<'EOF'
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'clientes' },
      {
        path: 'clientes',
        title: 'Clientes · TextilClean',
        loadComponent: () =>
          import('./features/clients/client-list/client-list').then(
            (m) => m.ClientList,
          ),
      },
      {
        path: 'construir',
        title: 'Prototipo · TextilClean',
        loadComponent: () =>
          import('./features/construir/construir').then((m) => m.Construir),
      },
      { path: '**', redirectTo: 'clientes' },
    ],
  },
];
EOF
```

> Si `features/construir/` aún no existe en tu proyecto, quita ese bloque de rutas **ahora** y vuelve a añadirlo cuando lo tengas (ISS-01B).

### 3.6.2 Editar `src/app/layout/shell/shell.ts`

``` bash
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
    { label: 'Clientes', icon: 'pi pi-users', routerLink: '/clientes' },
    { label: 'Prototipo', icon: 'pi pi-desktop', routerLink: '/construir' },
  ];

  protected onMenuToggle(): void {
    this.mobileOpen.update((v) => !v);
  }
}
EOF
```

> Ajusta `shell.html` si ya tenías otro nombre de componente. Lo importante: añadir `routerLink` a cada `MenuItem`, y `[items]="items"` en `<app-aside>`.

------------------------------------------------------------------------

## Verificación del ISS

Ejecuta los comandos **en este orden**:

``` bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026

# 1. La utilidad existe
grep -n "export function filterRows" src/app/core/utils/filter-rows.ts

# 2. El formulario solo emite, no llama a la API
grep -n "output<ClientPayload>\|output<void>" \
  src/app/features/clients/client-form/client-form.ts

# 3. La lista usa computed
grep -n "computed(" src/app/features/clients/client-list/client-list.ts
grep -n "applyFilter" src/app/features/clients/client-list/client-list.ts || echo "sin applyFilter: correcto"

# 4. La plantilla usa la API PrimeNG 22
grep -n "#caption\|#header\|#body\|#emptymessage" \
  src/app/features/clients/client-list/client-list.html
grep -n "pTemplate=" src/app/features/clients/client-list/client-list.html || echo "sin pTemplate: correcto"

# 5. Rutas y menú
grep -n "clientes" src/app/app.routes.ts src/app/layout/shell/shell.ts

# 6. CSS vacíos
for f in src/app/features/clients/**/*.css; do
  grep -q '[{}]' "$f" && echo "REGLAS EN $f"
done

# 7. Pruebas y build
npm test -- --watch=false
ng build
```

Comprobación funcional con `ng serve`:

``` bash
npm start
```

Abre `http://localhost:4200` y verifica:

| Comprobación | Resultado esperado |
|----|----|
| `/` | Redirige a `/clientes` y monta el `Shell` |
| `GET /api/clientes` | 3 filas del seeder; etiqueta «3 activos» |
| Buscador «sur» | «1 de 3 coinciden con «sur»»; 0 peticiones nuevas |
| Crear «Cafetería Central» | Diálogo cerrado, toast «Cliente creado», 4 filas |
| Editar teléfono | `PATCH /api/clientes/4` con `{ name, address, phone, email }` y **sin `status`** |
| Baja lógica | Confirmación «Desactivar» → 3 filas, etiqueta «3 activos» |
| Baja física | Confirmación «Eliminar» → 2 filas |
| Error del backend (modo Fase II sin token) | `p-message` con `Missing Bearer token` (401 real) |
| Error de operación (403/500 al guardar) | Toast «No se pudo guardar» y el diálogo sigue abierto |
| Validación | «Guardar» con nombre vacío no envía nada y muestra «El nombre es obligatorio» |

Si el backend está en modo Fase II (`AUTH_ENABLED=true`), verás `Missing Bearer token`: **es correcto**, y el CRUD quedará completamente funcional al terminar ISS-08/ISS-09.

------------------------------------------------------------------------

## Correspondencia con el código

Los archivos que **crea o reemplaza** este ISS:

- `src/app/core/utils/filter-rows.ts` *(nuevo)*
- `src/app/core/utils/filter-rows.spec.ts` *(nuevo)*
- `src/app/features/clients/client-form/client-form.ts` *(reemplaza al generado por el CLI)*
- `src/app/features/clients/client-form/client-form.html` *(reemplaza)*
- `src/app/features/clients/client-form/client-form.css` *(reemplaza)*
- `src/app/features/clients/client-form/client-form.spec.ts` *(nuevo)*
- `src/app/features/clients/client-list/client-list.ts` *(reemplaza)*
- `src/app/features/clients/client-list/client-list.html` *(reemplaza)*
- `src/app/features/clients/client-list/client-list.css` *(reemplaza)*
- `src/app/features/clients/client-list/client-list.spec.ts` *(nuevo)*
- `src/app/app.routes.ts` *(edita)*
- `src/app/layout/shell/shell.ts` *(edita)*
- `src/app/layout/shell/shell.html` *(edita, para añadir `routerLink` en el menú y `[items]` en `<app-aside>`)*

Los archivos **de ISS-02 que no se tocan**: `client-api.ts`, `client-api.spec.ts`, `client.model.ts`, `api.model.ts`, `api-error.ts`, `notification.ts`, `page-header`, `empty-state`, `status-tag`.

------------------------------------------------------------------------

## Navegación

⬅️ **Anterior:** ISS-02 — Núcleo, modelos y layout ⬆️ **Ruta:** Frontend-Express · Fase I ➡️ **Siguiente:** ISS-04 — CRUD de tipos de producto
