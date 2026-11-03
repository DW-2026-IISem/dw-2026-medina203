# 🛠 ISS-04 · CRUD de tipos de producto

> **Proyecto frontend:** `front-textilclean-express` (carpeta real: `frontend-2026`)
> **Ruta frontend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026`
> **Proyecto backend:** `app-textilclean-express`
> **Ruta backend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express`
> **Fase:** I · Business · **Bloqueado por:** ISS-03 · **Habilita:** ISS-05
> **Vigencia:** revisión alineada con guía del docente del 23-oct-2026.
> **Capa:** 🛠 Construir (ejecutar, verificar y entregar)

---

## 0. Antes de tocar nada

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
pwd
```

Verifica que los archivos de **ISS-02** e **ISS-03** existen:

```bash
ls src/app/core/models/          # api.model.ts  client.model.ts  (product-type.model.ts se crea aquí)
ls src/app/core/utils/           # api-error.ts  filter-rows.ts
ls src/app/features/clients/     # client-api.ts  client-form/  client-list/
ls src/app/shared/ui/            # page-header/  empty-state/  status-tag/
```

Si `filter-rows.ts` o `status-tag` **no existen**, no continúes: vuelve a ISS-02/ISS-03.

---

## Objetivo y encaje en la fase

Repetir el patrón de **ISS-03** con una entidad más simple (`/api/tipos-producto`). El objetivo didáctico es **interiorizar el patrón** (`servicio → estado con signals → formulario → lista`) antes de añadir relaciones en ISS-05.

> **Alcance de fase.** Todo lo de esta ISS es **Fase I (Business)**: sin login, interceptor, guards ni `*appHasPermission`. La protección de esta pantalla se añade en **ISS-09**, sin reescribir el componente.

**Evidencia de aprendizaje:** explica qué se reutiliza y qué cambia; navega por URL directa `/tipos-producto` sin perder Header ni Footer.

**Equipo y terminal:** Ubuntu WSL, terminal del editor, carpeta `frontend-2026`.

---

## 4.1 Endpoint y contrato

| Operación | Método y ruta | Respuesta |
|---|---|---|
| Listar activos | `GET /api/tipos-producto` | `{ product_types }` |
| Obtener uno | `GET /api/tipos-producto/:id` | `{ product_type }` |
| Crear | `POST /api/tipos-producto` | `{ product_type }` |
| Actualizar | `PATCH /api/tipos-producto/:id` | `{ product_type }` |
| Reemplazar | `PUT /api/tipos-producto/:id` | `{ product_type }` |
| Baja lógica | `PATCH /api/tipos-producto/:id/deactivate` | `{ product_type }` |
| Baja física | `DELETE /api/tipos-producto/:id` | `204` |

> ⚠️ Ojo con la ruta: es `/tipos-producto` (en español), **no** `/product-types`. El backend `app-textilclean-express` usa rutas en español para el negocio y en inglés para auth.

### Verifica el backend antes de empezar

```bash
curl -s http://localhost:4000/api/tipos-producto | head -c 300
```

- **200** con `{ "product_types": [...] }` → backend en Fase I (`AUTH_ENABLED=false`). Perfecto.
- **401** `Missing Bearer token` → backend en Fase II. Ajusta `AUTH_ENABLED=false` en el `.env` del backend mientras terminas ISS-09:
  ```bash
  cd ~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express
  # edita .env: AUTH_ENABLED=false
  npm run dev
  ```

---

## Criterios de aceptación (ISS-04)

- [ ] La tabla lista los tipos activos del backend.
- [ ] Crear/editar validan nombre obligatorio y máximo 120.
- [ ] La baja lógica oculta el tipo del listado.
- [ ] El buscador filtra por **nombre y descripción** usando `filterRows`.
- [ ] La ruta `/tipos-producto` funciona por **URL directa** (no solo por menú).
- [ ] `ng serve` compila sin errores.

---

## 4.2 Modelo (si no existe en ISS-02)

```bash
cat > src/app/core/models/product-type.model.ts <<'EOF'
import { Status } from './api.model';

/**
 * Tipo de producto: catálogo base para clasificar productos.
 *
 * El backend usa snake_case en la respuesta (`product_types`), pero aquí el
 * modelo del frontend usa camelCase: el `ProductTypeApi` hace el `map`.
 */
export interface ProductType {
  id: number;
  name: string;
  description: string | null;
  status: Status;
}

/** Payload de alta. En edición se omite `status` (lo gobierna /deactivate). */
export interface ProductTypePayload {
  name: string;
  description: string | null;
  status?: Status;
}
EOF
```

Si ya existía en ISS-02, **no lo sobrescribas**: verifica con `cat src/app/core/models/product-type.model.ts` que tiene la misma forma.

---

## 4.3 Generar los dos componentes

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
ng generate component features/product-types/product-type-list --skip-tests --defaults
ng generate component features/product-types/product-type-form --skip-tests --defaults
```

Comprueba la estructura:

```bash
ls -R src/app/features/product-types/
```

Debe quedar así (los `.spec.ts` del CLI se sustituyen más abajo por los completos):

```
src/app/features/product-types/
├── product-type-api.ts
├── product-type-api.spec.ts
├── product-type-form/
│   ├── product-type-form.ts
│   ├── product-type-form.html
│   ├── product-type-form.css
│   └── product-type-form.spec.ts
└── product-type-list/
    ├── product-type-list.ts
    ├── product-type-list.html
    ├── product-type-list.css
    └── product-type-list.spec.ts
```

> `--skip-tests` **no evita pruebas**: los `.spec.ts` de esta ISS son más largos que la plantilla del CLI y los sobrescribes con `cat >`.

---

## 4.4 Servicio

```bash
cat > src/app/features/product-types/product-type-api.ts <<'EOF'
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProductType,
  ProductTypePayload,
} from '../../core/models/product-type.model';

/** /api/tipos-producto — la respuesta usa snake_case `product_types`. */
@Injectable({ providedIn: 'root' })
export class ProductTypeApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tipos-producto`;

  list(): Observable<ProductType[]> {
    return this.http
      .get<{ product_types: ProductType[] }>(this.base)
      .pipe(map((response) => response.product_types));
  }

  get(id: number): Observable<ProductType> {
    return this.http
      .get<{ product_type: ProductType }>(`${this.base}/${id}`)
      .pipe(map((response) => response.product_type));
  }

  create(payload: ProductTypePayload): Observable<ProductType> {
    return this.http
      .post<{ product_type: ProductType }>(this.base, payload)
      .pipe(map((response) => response.product_type));
  }

  update(
    id: number,
    payload: Partial<ProductTypePayload>,
  ): Observable<ProductType> {
    return this.http
      .patch<{ product_type: ProductType }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.product_type));
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

### Prueba del servicio

```bash
cat > src/app/features/product-types/product-type-api.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ProductTypeApi } from './product-type-api';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/tipos-producto`;

describe('ProductTypeApi', () => {
  let api: ProductTypeApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProductTypeApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps product_types from list()', () => {
    let out: unknown;
    api.list().subscribe((r) => (out = r));
    http.expectOne(BASE).flush({ product_types: [{ id: 1, name: 'Aseo' }] });
    expect(out).toEqual([{ id: 1, name: 'Aseo' }]);
  });

  it('GETs a single type', () => {
    let out: unknown;
    api.get(1).subscribe((r) => (out = r));
    http.expectOne(`${BASE}/1`).flush({ product_type: { id: 1, name: 'Aseo' } });
    expect(out).toEqual({ id: 1, name: 'Aseo' });
  });

  it('POSTs a new type', () => {
    let out: unknown;
    api.create({ name: 'Congelados', description: null }).subscribe(
      (r) => (out = r),
    );
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush({ product_type: { id: 9, name: 'Congelados' } });
    expect(out).toEqual({ id: 9, name: 'Congelados' });
  });

  it('PATCHes without status', () => {
    api.update(2, { name: 'Nuevo' }).subscribe();
    const req = http.expectOne(`${BASE}/2`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'Nuevo' });
    req.flush({ product_type: { id: 2, name: 'Nuevo' } });
  });

  it('PATCHes /deactivate', () => {
    api.deactivate(3).subscribe();
    const req = http.expectOne(`${BASE}/3/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('DELETEs physically', () => {
    api.remove(3).subscribe();
    const req = http.expectOne(`${BASE}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
EOF
```

---

## 4.5 Formulario

### 4.5.1 `product-type-form.ts`

```bash
cat > src/app/features/product-types/product-type-form/product-type-form.ts <<'EOF'
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
import {
  ProductType,
  ProductTypePayload,
} from '../../../core/models/product-type.model';

@Component({
  host: { class: 'block' },
  selector: 'app-product-type-form',
  imports: [
    MessageModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './product-type-form.html',
  styleUrl: './product-type-form.css',
})
export class ProductTypeForm {
  readonly productType = input<ProductType | null>(null);

  /** Se incrementa al reabrir «Nuevo tipo»; obliga al effect a correr. */
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<ProductTypePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.productType();
      this.resetKey(); // reabrir el diálogo debe vaciar el formulario

      this.form.reset({
        name: current?.name ?? '',
        description: current?.description ?? '',
        status: current?.status ?? 'active',
      });

      // PATCH/PUT no aceptan `status`: el estado solo cambia con /deactivate.
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
    this.saved.emit({
      name: value.name.trim(),
      description: value.description.trim() || null,
      ...(this.productType() ? {} : { status: value.status }),
    });
  }
}
EOF
```

### 4.5.2 `product-type-form.html`

```bash
cat > src/app/features/product-types/product-type-form/product-type-form.html <<'EOF'
<form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
  <div>
    <label for="type-name" class="mb-1 block text-sm font-medium text-slate-700">
      Nombre <span class="text-red-500">*</span>
    </label>
    <input
      id="type-name"
      pInputText
      formControlName="name"
      placeholder="Aseo"
      class="w-full"
    />
    @if (form.controls.name.touched && form.controls.name.invalid) {
      <p-message severity="error" size="small" variant="simple" styleClass="mt-1">
        El nombre es obligatorio (máximo 120 caracteres).
      </p-message>
    }
  </div>

  <div>
    <label for="type-description" class="mb-1 block text-sm font-medium text-slate-700">
      Descripción
    </label>
    <textarea
      id="type-description"
      pTextarea
      formControlName="description"
      rows="3"
      placeholder="Productos de limpieza y cuidado personal"
      class="w-full"
    ></textarea>
  </div>

  <div>
    <label for="type-status" class="mb-1 block text-sm font-medium text-slate-700">
      Estado
    </label>
    <p-select
      inputId="type-status"
      formControlName="status"
      [options]="statusOptions"
      optionLabel="label"
      optionValue="value"
      [fluid]="true"
    />
    @if (productType()) {
      <p class="mt-1 text-xs text-slate-500">
        El estado de un tipo existente solo cambia con la baja lógica.
      </p>
    }
  </div>

  <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
    <button
      pButton
      type="button"
      severity="secondary"
      outlined
      (click)="cancelled.emit()"
    >
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

### 4.5.3 `product-type-form.css` (vacío a propósito)

```bash
cat > src/app/features/product-types/product-type-form/product-type-form.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 4.5.4 `product-type-form.spec.ts`

```bash
cat > src/app/features/product-types/product-type-form/product-type-form.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { ProductTypeForm } from './product-type-form';

const TYPE = {
  id: 1,
  name: 'Aseo',
  description: 'Limpieza',
  status: 'active' as const,
};

describe('ProductTypeForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductTypeForm],
    }).compileComponents();
  });

  function crear(type: typeof TYPE | null = null) {
    const fixture = TestBed.createComponent(ProductTypeForm);
    fixture.componentRef.setInput('productType', type);
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
    expect(fixture.componentInstance.form.controls.name.invalid).toBe(true);
  });

  it('should mark name invalid when longer than 120', () => {
    const fixture = crear(null);
    fixture.componentInstance.form.controls.name.setValue('a'.repeat(121));
    expect(fixture.componentInstance.form.controls.name.invalid).toBe(true);
  });

  it('should emit a POST-like payload with status from creation mode', () => {
    const fixture = crear(null);
    const out: unknown[] = [];
    fixture.componentInstance.saved.subscribe((p) => out.push(p));

    fixture.componentInstance.form.patchValue({
      name: '  Congelados  ',
      description: '',
      status: 'active',
    });
    fixture.componentInstance.submit();

    expect(out).toEqual([
      { name: 'Congelados', description: null, status: 'active' },
    ]);
  });

  it('should load type data and disable status in edit mode', () => {
    const fixture = crear(TYPE);
    const form = fixture.componentInstance.form;
    expect(form.controls.name.value).toBe('Aseo');
    expect(form.controls.status.disabled).toBe(true);
  });

  it('should emit a PATCH-like payload without status in edit mode', () => {
    const fixture = crear(TYPE);
    const out: unknown[] = [];
    fixture.componentInstance.saved.subscribe((p) => out.push(p));

    fixture.componentInstance.form.patchValue({ name: 'Aseo y limpieza' });
    fixture.componentInstance.submit();

    expect(out).toEqual([
      { name: 'Aseo y limpieza', description: 'Limpieza' },
    ]);
  });

  it('should not emit when invalid', () => {
    const fixture = crear(null);
    let emitido = false;
    fixture.componentInstance.saved.subscribe(() => (emitido = true));
    fixture.componentInstance.submit();
    expect(emitido).toBe(false);
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

> **`resetKey`** cumple el mismo papel que en ISS-03: `editing()` vuelve a `null` al reabrir «Nuevo tipo», así que sin una llave que cambie el `effect()` del formulario **no se reinicia** y conservaría lo último escrito.

---

## 4.6 Lista

### 4.6.1 `product-type-list.ts`

```bash
cat > src/app/features/product-types/product-type-list/product-type-list.ts <<'EOF'
import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import {
  ProductType,
  ProductTypePayload,
} from '../../../core/models/product-type.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { ProductTypeApi } from '../product-type-api';
import { ProductTypeForm } from '../product-type-form/product-type-form';

@Component({
  host: { class: 'block' },
  selector: 'app-product-type-list',
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
    ProductTypeForm,
  ],
  templateUrl: './product-type-list.html',
  styleUrl: './product-type-list.css',
})
export class ProductTypeList {
  private readonly api = inject(ProductTypeApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<ProductType[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (row) => [row.name, row.description]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<ProductType | null>(null);
  readonly resetKey = signal(0);

  readonly title = computed(() =>
    this.editing() ? 'Editar tipo' : 'Nuevo tipo',
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

  openEdit(type: ProductType): void {
    this.editing.set(type);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  save(payload: ProductTypePayload): void {
    const current = this.editing();
    this.saving.set(true);

    const request = current
      ? this.api.update(current.id, payload)
      : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Tipo actualizado' : 'Tipo creado');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(type: ProductType): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar «${type.name}»? Su estado pasará a inactivo.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(type.id).subscribe({
          next: () => {
            this.notify.warn('Tipo desactivado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo desactivar', toApiMessage(error));
          },
        });
      },
    });
  }

  remove(type: ProductType): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará «${type.name}» de la base de datos. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(type.id).subscribe({
          next: () => {
            this.notify.success('Tipo eliminado');
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

### 4.6.2 `product-type-list.html`

```bash
cat > src/app/features/product-types/product-type-list/product-type-list.html <<'EOF'
<app-page-header
  title="Tipos de producto"
  subtitle="Catálogo base de los productos. El backend solo lista los activos."
>
  <p-tag [value]="rows().length + ' activos'" severity="info" [rounded]="true" />
  <button pButton type="button" (click)="openCreate()">
    <i pButtonIcon class="pi pi-plus"></i>
    <span pButtonLabel>Nuevo tipo</span>
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
    tableStyleClass="min-w-2xl"
  >
    <ng-template #caption>
      <div class="flex items-center gap-2">
        <i class="pi pi-search text-slate-400"></i>
        <input
          pInputText
          type="search"
          aria-label="Buscar tipos de producto"
          placeholder="Buscar por nombre o descripción…"
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
          <div class="flex items-center gap-1">
            Nombre <p-sort-icon field="name" />
          </div>
        </th>
        <th>Descripción</th>
        <th>Estado</th>
        <th class="w-40 text-right">Acciones</th>
      </tr>
    </ng-template>

    <ng-template #body let-type>
      <tr>
        <td>
          <p class="font-medium text-slate-800">{{ type.name }}</p>
          <p class="text-xs text-slate-400">#{{ type.id }}</p>
        </td>
        <td class="text-sm text-slate-600">{{ type.description || '—' }}</td>
        <td><app-status-tag [status]="type.status" /></td>
        <td>
          <div class="flex justify-end gap-1">
            <button
              pButton
              type="button"
              text
              rounded
              severity="secondary"
              icon="pi pi-pencil"
              aria-label="Editar tipo"
              pTooltip="Editar"
              (click)="openEdit(type)"
            ></button>
            <button
              pButton
              type="button"
              text
              rounded
              severity="warn"
              icon="pi pi-ban"
              aria-label="Dar de baja el tipo"
              pTooltip="Baja lógica"
              (click)="deactivate(type)"
            ></button>
            <button
              pButton
              type="button"
              text
              rounded
              severity="danger"
              icon="pi pi-trash"
              aria-label="Eliminar tipo"
              pTooltip="Eliminar"
              (click)="remove(type)"
            ></button>
          </div>
        </td>
      </tr>
    </ng-template>

    <ng-template #emptymessage>
      <tr>
        <td colspan="4">
          @if (filter()) {
            <app-empty-state
              icon="pi pi-search"
              title="Sin coincidencias"
              message="Ningún tipo coincide con la búsqueda. Borra el filtro para ver todos."
            />
          } @else {
            <app-empty-state
              icon="pi pi-tags"
              title="Sin tipos activos"
              message="Crea el primero con «Nuevo tipo» o ejecuta el seeder del backend."
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
  styleClass="w-full max-w-xl mx-4"
>
  <app-product-type-form
    [productType]="editing()"
    [saving]="saving()"
    [resetKey]="resetKey()"
    (saved)="save($event)"
    (cancelled)="dialogVisible.set(false)"
  />
</p-dialog>
EOF
```

### 4.6.3 `product-type-list.css` (vacío a propósito)

```bash
cat > src/app/features/product-types/product-type-list/product-type-list.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 4.6.4 `product-type-list.spec.ts`

```bash
cat > src/app/features/product-types/product-type-list/product-type-list.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductTypeList } from './product-type-list';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl}/tipos-producto`;

const TIPOS = [
  { id: 1, name: 'Aseo', description: 'Limpieza', status: 'active' as const },
  { id: 2, name: 'Congelados', description: null, status: 'active' as const },
  { id: 3, name: 'Bebidas', description: 'Líquidos', status: 'active' as const },
];

describe('ProductTypeList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductTypeList],
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
    const fixture = TestBed.createComponent(ProductTypeList);
    fixture.detectChanges();
    http.expectOne(BASE).flush({ product_types: TIPOS });
    await fixture.whenStable();
    return { fixture, lista: fixture.componentInstance };
  }

  it('should load the table with types', async () => {
    const { fixture } = await crearLista();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(
      TIPOS.length,
    );
  });

  it('should show an error message when GET fails', async () => {
    const fixture = TestBed.createComponent(ProductTypeList);
    fixture.detectChanges();
    http
      .expectOne(BASE)
      .flush({ error: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBeTruthy();
  });

  it('should filter by name and description without new HTTP calls', async () => {
    const { fixture, lista } = await crearLista();
    lista.filter.set('limpieza');
    fixture.detectChanges();
    expect(lista.visibleRows().length).toBe(1);
    expect(lista.visibleRows()[0].name).toBe('Aseo');
    http.expectNone(BASE);
  });

  it('should POST a new type and reload', async () => {
    const { lista } = await crearLista();
    lista.openCreate();
    lista.save({ name: 'Lácteos', description: null });
    const post = http.expectOne(BASE);
    expect(post.request.method).toBe('POST');
    post.flush({ product_type: { id: 4, name: 'Lácteos', description: null, status: 'active' } });
    http.expectOne(BASE).flush({
      product_types: [...TIPOS, { id: 4, name: 'Lácteos', description: null, status: 'active' }],
    });
  });

  it('should PATCH without status', async () => {
    const { lista } = await crearLista();
    lista.openEdit(TIPOS[0]);
    lista.save({ name: 'Aseo y limpieza', description: 'Limpieza' });
    const patch = http.expectOne(`${BASE}/1`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({
      name: 'Aseo y limpieza',
      description: 'Limpieza',
    });
    patch.flush({ product_type: { ...TIPOS[0], name: 'Aseo y limpieza' } });
    http.expectOne(BASE).flush({ product_types: TIPOS });
  });

  it('should call deactivate after confirmation', async () => {
    const { lista } = await crearLista();
    const confirmacion = TestBed.inject(ConfirmationService);
    spyOn(confirmacion, 'confirm').and.callFake((opts: any) => {
      opts.accept?.();
      return confirmacion;
    });
    lista.deactivate(TIPOS[0]);
    const baja = http.expectOne(`${BASE}/1/deactivate`);
    expect(baja.request.method).toBe('PATCH');
    baja.flush({});
    http.expectOne(BASE).flush({ product_types: TIPOS.slice(1) });
  });

  it('should call DELETE for physical removal', async () => {
    const { lista } = await crearLista();
    const confirmacion = TestBed.inject(ConfirmationService);
    spyOn(confirmacion, 'confirm').and.callFake((opts: any) => {
      opts.accept?.();
      return confirmacion;
    });
    lista.remove(TIPOS[0]);
    const del = http.expectOne(`${BASE}/1`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
    http.expectOne(BASE).flush({ product_types: TIPOS.slice(1) });
  });

  it('should show a toast on operation error', async () => {
    const { lista } = await crearLista();
    const mensajes = TestBed.inject(MessageService);
    spyOn(mensajes, 'add');
    lista.openCreate();
    lista.save({ name: 'X', description: null });
    http
      .expectOne(BASE)
      .flush({ error: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    expect(mensajes.add).toHaveBeenCalled();
  });
});
EOF
```

---

## 4.7 Ruta y menú

### 4.7.1 Editar `src/app/app.routes.ts`

Añade la ruta **debajo** de `clientes`:

```bash
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
        path: 'tipos-producto',
        title: 'Tipos de producto · TextilClean',
        loadComponent: () =>
          import(
            './features/product-types/product-type-list/product-type-list'
          ).then((m) => m.ProductTypeList),
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

> Si `features/construir/` aún no existe en tu proyecto, quita ese bloque **ahora**.

### 4.7.2 Editar `src/app/layout/shell/shell.ts`

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
    { label: 'Clientes', icon: 'pi pi-users', routerLink: '/clientes' },
    {
      label: 'Tipos de producto',
      icon: 'pi pi-tags',
      routerLink: '/tipos-producto',
    },
    { label: 'Prototipo', icon: 'pi pi-desktop', routerLink: '/construir' },
  ];

  protected onMenuToggle(): void {
    this.mobileOpen.update((v) => !v);
  }
}
EOF
```

> Ajusta `shell.html` si ya tenías otro nombre de componente. Lo importante: añadir `routerLink` a cada `MenuItem` y `[items]="items"` en `<app-aside>`.

---

## Verificación del ISS

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026

# 1. El servicio existe y usa /tipos-producto (no /product-types)
grep -n "tipos-producto" src/app/features/product-types/product-type-api.ts

# 2. El formulario solo emite, no llama a la API
grep -n "output<ProductTypePayload>\|output<void>" \
  src/app/features/product-types/product-type-form/product-type-form.ts

# 3. La lista usa computed y filterRows
grep -n "computed(\|filterRows(" src/app/features/product-types/product-type-list/product-type-list.ts

# 4. Plantillas PrimeNG 22 (sin pTemplate)
grep -n "#caption\|#header\|#body\|#emptymessage" \
  src/app/features/product-types/product-type-list/product-type-list.html
grep -n "pTemplate=" src/app/features/product-types/product-type-list/product-type-list.html || echo "sin pTemplate: correcto"

# 5. La ruta y el menú
grep -n "tipos-producto" src/app/app.routes.ts src/app/layout/shell/shell.ts

# 6. CSS vacíos
for f in src/app/features/product-types/**/*.css; do
  grep -q '[{}]' "$f" && echo "REGLAS EN $f"
done

# 7. Pruebas y build
npm test -- --watch=false
ng build
```

### Comprobación funcional

```bash
npm start
```

Abre `http://localhost:4200` y verifica:

| Comprobación | Resultado esperado |
|---|---|
| `/tipos-producto` por URL directa | Monta `Shell` (Header/Aside/Footer) y la pantalla |
| `GET /api/tipos-producto` | 3 filas del seeder; etiqueta «3 activos» |
| Buscador «limpieza» | «1 de 3 coinciden con «limpieza»»; 0 peticiones nuevas |
| Crear «Lácteos» | `POST 201`, diálogo cerrado, toast «Tipo creado», 4 filas |
| Editar nombre | `PATCH /api/tipos-producto/4` con `{ name, description }` y **sin `status`** |
| Estado en edición | `p-select` bloqueado con la nota «solo cambia con la baja lógica» |
| Validación | Nombre vacío y 121 caracteres no envían y marcan el campo |
| Baja lógica | Confirmación «Desactivar» → desaparece del listado |
| Estado vacío | Filtro sin coincidencias muestra «Ningún tipo coincide con la búsqueda» |
| Móvil (390 px) | Encabezado apilado y tabla con scroll horizontal; sin desbordes |

En el backend:

```bash
curl -s http://localhost:4000/api/tipos-producto | head -c 300
```

Debe reflejar el tipo recién creado.

---

## Correspondencia con el código

Archivos que **crea o reemplaza** este ISS:

- `src/app/core/models/product-type.model.ts` *(si no existía en ISS-02)*
- `src/app/features/product-types/product-type-api.ts` *(nuevo)*
- `src/app/features/product-types/product-type-api.spec.ts` *(nuevo)*
- `src/app/features/product-types/product-type-form/product-type-form.ts` *(reemplaza al generado por el CLI)*
- `src/app/features/product-types/product-type-form/product-type-form.html` *(reemplaza)*
- `src/app/features/product-types/product-type-form/product-type-form.css` *(reemplaza)*
- `src/app/features/product-types/product-type-form/product-type-form.spec.ts` *(nuevo)*
- `src/app/features/product-types/product-type-list/product-type-list.ts` *(reemplaza)*
- `src/app/features/product-types/product-type-list/product-type-list.html` *(reemplaza)*
- `src/app/features/product-types/product-type-list/product-type-list.css` *(reemplaza)*
- `src/app/features/product-types/product-type-list/product-type-list.spec.ts` *(nuevo)*
- `src/app/app.routes.ts` *(edita)*
- `src/app/layout/shell/shell.ts` *(edita)*
- `src/app/layout/shell/shell.html` *(edita, para añadir `routerLink` y `[items]`)*

Archivos **de ISS-02/ISS-03 que no se tocan**: `filter-rows.ts`, `api-error.ts`, `notification.ts`, `status-tag`, `page-header`, `empty-state`, y todo `features/clients/`.

---

## Notas del docente

- **Contrato en español.** Los endpoints del negocio son `/api/tipos-producto` (no `/product-types`). Las respuestas usan **snake_case** (`{ product_types }` / `{ product_type }`) y el `ProductTypeApi` hace el `map` a camelCase.
- **Lo que se reutiliza de ISS-03** (sin reescribir): `filterRows`, `NotificationService`, `toApiMessage`, `StatusTag`, `PageHeader`, `EmptyState`, el patrón `signal`/`computed`/`effect`, `resetKey`, `p-dialog` con `dismissableMask`.
- **Lo que cambia**: entidad (`Client → ProductType`), campos (`email/phone/address → description`), endpoints, nombres de componentes (`app-client-form → app-product-type-form`), y textos (`«Nuevo cliente» → «Nuevo tipo»`).
- **Permisos: todavía no.** En Fase I los botones se ven siempre. ISS-09 los envuelve con `*appHasPermission` sin tocar la lógica del componente.
- **`p-table` de PrimeNG 22.** Usa **variables de plantilla** (`#caption`, `#header`, `#body let-row`, `#emptymessage`). Con `pTemplate` la tabla **se pinta vacía sin error**.

---

## Navegación

⬅️ **Anterior:** ISS-03 — CRUD de clientes con Signals
⬆️ **Ruta:** Frontend-Express · Fase I · Business
➡️ **Siguiente:** ISS-05 — Productos con relación a tipos