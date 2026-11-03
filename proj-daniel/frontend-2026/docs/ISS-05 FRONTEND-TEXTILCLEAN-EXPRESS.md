# 🛠 ISS-05 · CRUD de productos y relación con tipos

> **Proyecto frontend:** `front-textilclean-express` (carpeta real: `frontend-2026`)
> **Ruta frontend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026`
> **Proyecto backend:** `app-textilclean-express`
> **Ruta backend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express`
> **Fase:** I · Business · **Bloqueado por:** ISS-04 · **Habilita:** ISS-06
> **Vigencia:** revisión alineada con guía del docente del 23-oct-2026.
> **Capa:** 🛠 Construir (ejecutar, verificar y entregar)

---

## 0. Antes de tocar nada

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
pwd
```

Verifica que las piezas previas existen:

```bash
ls src/app/core/models/          # api.model.ts  client.model.ts  product-type.model.ts
ls src/app/core/utils/           # api-error.ts  filter-rows.ts
ls src/app/features/product-types/   # product-type-api.ts  product-type-form/  product-type-list/
ls src/app/features/clients/          # client-api.ts        client-form/        client-list/
ls src/app/shared/ui/                 # page-header/  empty-state/  status-tag/
```

Si falta algo de lo anterior, **detente**: vuelve a ISS-02, ISS-03 o ISS-04.

---

## Objetivo y encaje en la fase

Implementar `/api/productos` introduciendo la **primera relación many-to-one**: cada producto pertenece a un `ProductType`. El formulario debe cargar los **tipos activos** y el listado debe mostrar el **nombre del tipo**, no solo el `id`.

> **Antes de construir:** muestra primero el tipo como `id`; carga tipos; resuelve el nombre con un `Map`; después agrega `p-select` y validaciones del producto.

**Evidencia de aprendizaje:** explica por qué `optionValue="id"` envía un **número** y no el objeto completo.

> **Alcance de fase.** Fase I (Business): sin login ni permisos. La pantalla se protege en **ISS-09** y sus botones se envuelven allí con `*appHasPermission`.

**Equipo y terminal:** Ubuntu WSL, terminal del editor, carpeta `frontend-2026`.

---

## Criterios de aceptación (ISS-05)

- [ ] El listado muestra **nombre, marca, tipo (texto), precio formateado y stock**.
- [ ] El formulario **solo permite elegir tipos activos** que devolvió el backend.
- [ ] Crear un producto con un tipo inactivo **falla** y el error se muestra al usuario.
- [ ] Editar **conserva el tipo seleccionado** (`product_type_id` numérico).
- [ ] `lowStockCount()` coincide con las filas en rojo/amarillo.
- [ ] `ng serve` compila sin errores y **sin warnings de budget**.

---

## 5.1 Modelo y reglas del backend

Reglas que el backend valida (muéstralas en la UI, sin duplicar en exceso):

- `product_type_id` debe existir y estar **activo** (`assertActiveProductType`).
- `price > 0`.
- `quantity` y `min_stock` son **enteros ≥ 0**.
- Al crear una venta se descuenta stock; al cancelar (baja lógica) o eliminar la venta se restaura el stock de sus líneas activas (`releaseStockOfActiveLines` en `sales.service.ts`).

### Modelo en el frontend

```bash
cat > src/app/core/models/product.model.ts <<'EOF'
import { Status } from './api.model';

/** Los DECIMAL del backend llegan como number o string: normalizamos con Number(). */
export type Money = number | string;

/** Timestamps que todos los recursos del backend devuelven. */
export interface Timestamps {
  created_at?: string;
  updated_at?: string;
}

export interface Product extends Timestamps {
  id: number;
  name: string;
  brand: string;
  price: Money;
  min_stock: number;
  quantity: number;
  product_type_id: number;
  status: Status;
}

/**
 * Payload de alta. En edición se omite `status` (lo gobierna /deactivate).
 */
export interface ProductPayload {
  name: string;
  brand: string;
  price: number;
  min_stock: number;
  quantity: number;
  product_type_id: number;
  status?: Status;
}
EOF
```

> Si ya existía en ISS-02, **no lo sobrescribas** sin verificarlo: `cat src/app/core/models/product.model.ts` y confirma que tiene `min_stock`, `quantity` y `product_type_id`.

---

## 5.2 Generar los dos componentes

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
ng generate component features/products/product-list --skip-tests --defaults
ng generate component features/products/product-form --skip-tests --defaults
```

Comprueba la estructura:

```bash
ls -R src/app/features/products/
```

Debe quedar así (los `.spec.ts` del CLI se sobrescriben más abajo):

```
src/app/features/products/
├── product-api.ts
├── product-api.spec.ts
├── product-form/
│   ├── product-form.ts
│   ├── product-form.html
│   ├── product-form.css
│   └── product-form.spec.ts
└── product-list/
    ├── product-list.ts
    ├── product-list.html
    ├── product-list.css
    └── product-list.spec.ts
```

---

## 5.3 Servicio

```bash
cat > src/app/features/products/product-api.ts <<'EOF'
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductPayload } from '../../core/models/product.model';

/** /api/productos — el backend valida que el ProductType esté activo. */
@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/productos`;

  list(): Observable<Product[]> {
    return this.http
      .get<{ products: Product[] }>(this.base)
      .pipe(map((response) => response.products));
  }

  get(id: number): Observable<Product> {
    return this.http
      .get<{ product: Product }>(`${this.base}/${id}`)
      .pipe(map((response) => response.product));
  }

  create(payload: ProductPayload): Observable<Product> {
    return this.http
      .post<{ product: Product }>(this.base, payload)
      .pipe(map((response) => response.product));
  }

  update(id: number, payload: Partial<ProductPayload>): Observable<Product> {
    return this.http
      .patch<{ product: Product }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.product));
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
cat > src/app/features/products/product-api.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ProductApi } from './product-api';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/productos`;

describe('ProductApi', () => {
  let api: ProductApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProductApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps products from list()', () => {
    let out: unknown;
    api.list().subscribe((r) => (out = r));
    http.expectOne(BASE).flush({ products: [{ id: 1, name: 'Detergente' }] });
    expect(out).toEqual([{ id: 1, name: 'Detergente' }]);
  });

  it('GETs a single product', () => {
    let out: unknown;
    api.get(1).subscribe((r) => (out = r));
    http.expectOne(`${BASE}/1`).flush({ product: { id: 1, name: 'Detergente' } });
    expect(out).toEqual({ id: 1, name: 'Detergente' });
  });

  it('POSTs a new product', () => {
    api
      .create({
        name: 'Detergente',
        brand: 'Marca',
        price: 10,
        min_stock: 2,
        quantity: 5,
        product_type_id: 1,
      })
      .subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush({ product: { id: 9 } });
  });

  it('PATCHes without status', () => {
    api.update(2, { quantity: 3 }).subscribe();
    const req = http.expectOne(`${BASE}/2`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ quantity: 3 });
    req.flush({ product: { id: 2 } });
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

## 5.4 Cargar productos y tipos en paralelo

`forkJoin` espera a los dos observables y entrega un objeto tipado. Es más rápido que dos llamadas secuenciales y evita pintar la tabla dos veces.

```ts
// fragmento de product-list.ts — se incluye completo en 5.6
import { forkJoin } from 'rxjs';

readonly rows  = signal<Product[]>([]);
readonly types = signal<ProductType[]>([]);

load(): void {
  this.loading.set(true);
  this.error.set(null);

  forkJoin({
    products: this.api.list(),
    types: this.typesApi.list(),
  }).subscribe({
    next: ({ products, types }) => {
      this.rows.set(products);
      this.types.set(types);
      this.loading.set(false);
    },
    error: (error: unknown) => {
      this.error.set(toApiMessage(error));
      this.loading.set(false);
    },
  });
}
```

> **Nota del docente.** En el proyecto consolidado, cuando existe RBAC, la carga de tipos se protege con `this.session.canPermission('GET /api/tipos-producto') ? this.typesApi.list() : of([])` para evitar un `403` evitable en el rol `SELLER`. En **Fase I** aún no hay sesión, así que **cargamos los tipos siempre**. En **ISS-09** se ajusta, sin tocar la lógica del componente.

### Mapa `id → nombre` con `computed`

La tabla solo tiene `product_type_id`. Para mostrar «Aseo» necesitamos resolverlo **sin buscar en un arreglo por cada fila** (O(n²)). Construimos un `Map` una vez:

```ts
readonly typeName = computed(() => {
  const map = new Map(this.types().map((type) => [type.id, type.name]));
  return (id: number) => map.get(id) ?? `Tipo #${id}`;
});
```

Uso en plantilla:

```html
<p-tag
  [value]="typeName()(row.product_type_id)"
  severity="secondary"
  [rounded]="true"
/>
```

`typeName()` devuelve una **función**. Es intencional: `computed` reconstruye el `Map` **solo cuando cambian los tipos**, y la función resuelve cada fila.

---

## 5.5 Stock bajo con `computed`

```ts
readonly lowStockCount = computed(
  () =>
    this.rows().filter((p) => p.quantity <= p.min_stock).length,
);
```

En el header:

```html
<p-tag
  [value]="lowStockCount() + ' con stock bajo'"
  severity="warn"
  [rounded]="true"
/>
```

> **⚠️ Discrepancia conocida.** El criterio del producto usa `min_stock`; el **dashboard de ISS-07** usa un umbral fijo `5`. Es una discrepancia **pendiente de decisión** en el código consolidado. Esta ISS respeta `min_stock`; en ISS-07 se documenta la decisión.

---

## 5.6 Formulario

### 5.6.1 `product-form.ts`

```bash
cat > src/app/features/products/product-form/product-form.ts <<'EOF'
import { Component, effect, inject, input, output } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Status } from '../../../core/models/api.model';
import { Product, ProductPayload } from '../../../core/models/product.model';
import { ProductType } from '../../../core/models/product-type.model';

@Component({
  host: { class: 'block' },
  selector: 'app-product-form',
  imports: [
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    SelectModule,
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductForm {
  readonly product = input<Product | null>(null);
  readonly productTypes = input<ProductType[]>([]);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<ProductPayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    brand: ['', [Validators.required, Validators.maxLength(120)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    min_stock: [0, [Validators.required, Validators.min(0)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    product_type_id: [null as number | null, [Validators.required]],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.product();
      this.resetKey(); // reabrir el diálogo debe vaciar el formulario

      this.form.reset({
        name: current?.name ?? '',
        brand: current?.brand ?? '',
        price: Number(current?.price ?? 0),
        min_stock: current?.min_stock ?? 0,
        quantity: current?.quantity ?? 0,
        product_type_id: current?.product_type_id ?? null,
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
    const value = this.form.getRawValue();
    if (this.form.invalid || value.product_type_id === null) {
      this.form.markAllAsTouched();
      return;
    }

    this.saved.emit({
      name: value.name.trim(),
      brand: value.brand.trim(),
      price: Number(value.price),
      min_stock: Number(value.min_stock),
      quantity: Number(value.quantity),
      product_type_id: value.product_type_id,
      ...(this.product() ? {} : { status: value.status }),
    });
  }
}
EOF
```

### 5.6.2 `product-form.html`

```bash
cat > src/app/features/products/product-form/product-form.html <<'EOF'
<form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label for="product-name" class="mb-1 block text-sm font-medium text-slate-700">
        Nombre <span class="text-red-500">*</span>
      </label>
      <input
        id="product-name"
        pInputText
        formControlName="name"
        placeholder="Detergente líquido 1 L"
        class="w-full"
      />
      @if (form.controls.name.touched && form.controls.name.invalid) {
        <p-message severity="error" size="small" variant="simple" styleClass="mt-1">
          El nombre es obligatorio (máximo 120 caracteres).
        </p-message>
      }
    </div>

    <div>
      <label for="product-brand" class="mb-1 block text-sm font-medium text-slate-700">
        Marca <span class="text-red-500">*</span>
      </label>
      <input
        id="product-brand"
        pInputText
        formControlName="brand"
        placeholder="Marca del producto"
        class="w-full"
      />
      @if (form.controls.brand.touched && form.controls.brand.invalid) {
        <p-message severity="error" size="small" variant="simple" styleClass="mt-1">
          La marca es obligatoria (máximo 120 caracteres).
        </p-message>
      }
    </div>
  </div>

  <div>
    <label for="product-type" class="mb-1 block text-sm font-medium text-slate-700">
      Tipo de producto <span class="text-red-500">*</span>
    </label>
    <p-select
      inputId="product-type"
      formControlName="product_type_id"
      [options]="productTypes()"
      optionLabel="name"
      optionValue="id"
      placeholder="Selecciona un tipo activo"
      [filter]="true"
      [fluid]="true"
    />
    @if (productTypes().length === 0) {
      <p class="mt-1 text-xs text-slate-500">
        No hay tipos activos. Crea uno en «Tipos de producto» antes de continuar.
      </p>
    }
  </div>

  <div class="grid gap-4 sm:grid-cols-3">
    <div>
      <label for="product-price" class="mb-1 block text-sm font-medium text-slate-700">
        Precio <span class="text-red-500">*</span>
      </label>
      <p-inputnumber
        inputId="product-price"
        formControlName="price"
        mode="decimal"
        [min]="0.01"
        [minFractionDigits]="2"
        [maxFractionDigits]="2"
        [fluid]="true"
      />
    </div>

    <div>
      <label for="product-quantity" class="mb-1 block text-sm font-medium text-slate-700">
        Cantidad <span class="text-red-500">*</span>
      </label>
      <p-inputnumber
        inputId="product-quantity"
        formControlName="quantity"
        [min]="0"
        [showButtons]="true"
        [fluid]="true"
      />
    </div>

    <div>
      <label for="product-min-stock" class="mb-1 block text-sm font-medium text-slate-700">
        Stock mínimo <span class="text-red-500">*</span>
      </label>
      <p-inputnumber
        inputId="product-min-stock"
        formControlName="min_stock"
        [min]="0"
        [showButtons]="true"
        [fluid]="true"
      />
    </div>
  </div>

  <div>
    <label for="product-status" class="mb-1 block text-sm font-medium text-slate-700">
      Estado
    </label>
    <p-select
      inputId="product-status"
      formControlName="status"
      [options]="statusOptions"
      optionLabel="label"
      optionValue="value"
      [fluid]="true"
    />
    @if (product()) {
      <p class="mt-1 text-xs text-slate-500">
        El estado de un producto existente solo cambia con la baja lógica.
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

### 5.6.3 `product-form.css` (vacío a propósito)

```bash
cat > src/app/features/products/product-form/product-form.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 5.6.4 `product-form.spec.ts`

```bash
cat > src/app/features/products/product-form/product-form.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { ProductForm } from './product-form';

const TYPES = [
  { id: 1, name: 'Aseo', description: null, status: 'active' as const },
  { id: 2, name: 'Congelados', description: null, status: 'active' as const },
];

const PRODUCT = {
  id: 1,
  name: 'Detergente',
  brand: 'Marca',
  price: 10,
  min_stock: 2,
  quantity: 5,
  product_type_id: 1,
  status: 'active' as const,
};

describe('ProductForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductForm],
    }).compileComponents();
  });

  function crear(product: typeof PRODUCT | null = null) {
    const fixture = TestBed.createComponent(ProductForm);
    fixture.componentRef.setInput('product', product);
    fixture.componentRef.setInput('productTypes', TYPES);
    fixture.detectChanges();
    return fixture;
  }

  it('should start in creation mode with active status', () => {
    const fixture = crear(null);
    const form = fixture.componentInstance.form;
    expect(form.controls.name.value).toBe('');
    expect(form.controls.status.value).toBe('active');
    expect(form.controls.product_type_id.value).toBeNull();
  });

  it('should mark name, brand and price as invalid when required', () => {
    const fixture = crear(null);
    const { name, brand, price } = fixture.componentInstance.form.controls;
    expect(name.invalid).toBe(true);
    expect(brand.invalid).toBe(true);
    expect(price.invalid).toBe(true);
  });

  it('should not emit when product_type_id is null', () => {
    const fixture = crear(null);
    let emitido = false;
    fixture.componentInstance.saved.subscribe(() => (emitido = true));

    fixture.componentInstance.form.patchValue({
      name: 'Detergente',
      brand: 'Marca',
      price: 10,
      min_stock: 2,
      quantity: 5,
    });
    fixture.componentInstance.submit();
    expect(emitido).toBe(false);
  });

  it('should emit a POST-like payload from creation mode', () => {
    const fixture = crear(null);
    const out: unknown[] = [];
    fixture.componentInstance.saved.subscribe((p) => out.push(p));

    fixture.componentInstance.form.patchValue({
      name: 'Detergente',
      brand: 'Marca',
      price: 10,
      min_stock: 2,
      quantity: 5,
      product_type_id: 2,
      status: 'active',
    });
    fixture.componentInstance.submit();

    expect(out).toEqual([
      {
        name: 'Detergente',
        brand: 'Marca',
        price: 10,
        min_stock: 2,
        quantity: 5,
        product_type_id: 2,
        status: 'active',
      },
    ]);
  });

  it('should load product data and disable status in edit mode', () => {
    const fixture = crear(PRODUCT);
    const form = fixture.componentInstance.form;
    expect(form.controls.name.value).toBe('Detergente');
    expect(form.controls.product_type_id.value).toBe(1);
    expect(form.controls.status.disabled).toBe(true);
  });

  it('should emit a PATCH-like payload without status in edit mode', () => {
    const fixture = crear(PRODUCT);
    const out: unknown[] = [];
    fixture.componentInstance.saved.subscribe((p) => out.push(p));

    fixture.componentInstance.form.patchValue({ quantity: 8 });
    fixture.componentInstance.submit();

    expect(out).toEqual([
      {
        name: 'Detergente',
        brand: 'Marca',
        price: 10,
        min_stock: 2,
        quantity: 8,
        product_type_id: 1,
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

> **`optionValue="id"`** hace que el formulario guarde un `number`, no el objeto completo. Es exactamente lo que espera `product_type_id` en el payload.

---

## 5.7 Lista

### 5.7.1 `product-list.ts`

```bash
cat > src/app/features/products/product-list/product-list.ts <<'EOF'
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { Product, ProductPayload } from '../../../core/models/product.model';
import { ProductType } from '../../../core/models/product-type.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { ProductTypeApi } from '../../product-types/product-type-api';
import { ProductApi } from '../product-api';
import { ProductForm } from '../product-form/product-form';

@Component({
  host: { class: 'block' },
  selector: 'app-product-list',
  imports: [
    ButtonModule,
    CurrencyPipe,
    DialogModule,
    EmptyState,
    InputTextModule,
    MessageModule,
    PageHeader,
    ProductForm,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  private readonly api = inject(ProductApi);
  private readonly typesApi = inject(ProductTypeApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<Product[]>([]);
  readonly types = signal<ProductType[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (row) => [
      row.name,
      row.brand,
      this.typeName()(row.product_type_id),
    ]),
  );

  readonly typeName = computed(() => {
    const map = new Map(this.types().map((type) => [type.id, type.name]));
    return (id: number) => map.get(id) ?? `Tipo #${id}`;
  });

  readonly lowStockCount = computed(
    () => this.rows().filter((p) => p.quantity <= p.min_stock).length,
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<Product | null>(null);
  readonly resetKey = signal(0);

  readonly title = computed(() =>
    this.editing() ? 'Editar producto' : 'Nuevo producto',
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      products: this.api.list(),
      types: this.typesApi.list(),
    }).subscribe({
      next: ({ products, types }) => {
        this.rows.set(products);
        this.types.set(types);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.rows.set([]);
        this.types.set([]);
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

  openEdit(product: Product): void {
    this.editing.set(product);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  save(payload: ProductPayload): void {
    const current = this.editing();
    this.saving.set(true);

    const request = current
      ? this.api.update(current.id, payload)
      : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Producto actualizado' : 'Producto creado');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(product: Product): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar «${product.name}»? Su estado pasará a inactivo.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(product.id).subscribe({
          next: () => {
            this.notify.warn('Producto desactivado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo desactivar', toApiMessage(error));
          },
        });
      },
    });
  }

  remove(product: Product): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará «${product.name}» de la base de datos. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(product.id).subscribe({
          next: () => {
            this.notify.success('Producto eliminado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo eliminar', toApiMessage(error));
          },
        });
      },
    });
  }

  severityFor(product: Product): 'success' | 'warn' | 'danger' {
    if (product.quantity === 0) return 'danger';
    if (product.quantity <= product.min_stock) return 'warn';
    return 'success';
  }
}
EOF
```

### 5.7.2 `product-list.html`

```bash
cat > src/app/features/products/product-list/product-list.html <<'EOF'
<app-page-header
  title="Productos"
  subtitle="Inventario actual. El semáforo usa el stock mínimo del producto."
>
  <p-tag [value]="rows().length + ' activos'" severity="info" [rounded]="true" />
  @if (lowStockCount() > 0) {
    <p-tag
      [value]="lowStockCount() + ' con stock bajo'"
      severity="warn"
      [rounded]="true"
    />
  }
  <button pButton type="button" (click)="openCreate()">
    <i pButtonIcon class="pi pi-plus"></i>
    <span pButtonLabel>Nuevo producto</span>
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
    tableStyleClass="min-w-4xl"
  >
    <ng-template #caption>
      <div class="flex items-center gap-2">
        <i class="pi pi-search text-slate-400"></i>
        <input
          pInputText
          type="search"
          aria-label="Buscar productos"
          placeholder="Buscar por nombre, marca o tipo…"
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
            Producto <p-sort-icon field="name" />
          </div>
        </th>
        <th>Tipo</th>
        <th pSortableColumn="price">
          <div class="flex items-center gap-1">
            Precio <p-sort-icon field="price" />
          </div>
        </th>
        <th>Stock</th>
        <th>Estado</th>
        <th class="w-40 text-right">Acciones</th>
      </tr>
    </ng-template>

    <ng-template #body let-product>
      <tr>
        <td>
          <p class="font-medium text-slate-800">{{ product.name }}</p>
          <p class="text-xs text-slate-400">
            {{ product.brand }} · #{{ product.id }}
          </p>
        </td>
        <td>
          <p-tag
            [value]="typeName()(product.product_type_id)"
            severity="secondary"
            [rounded]="true"
          />
        </td>
        <td class="text-sm font-medium text-slate-700">
          {{ product.price | currency: 'USD' : 'symbol' : '1.2-2' }}
        </td>
        <td>
          <p-tag
            [value]="product.quantity.toString()"
            [severity]="severityFor(product)"
            [rounded]="true"
          />
        </td>
        <td><app-status-tag [status]="product.status" /></td>
        <td>
          <div class="flex justify-end gap-1">
            <button
              pButton type="button" text rounded severity="secondary"
              icon="pi pi-pencil" aria-label="Editar producto"
              pTooltip="Editar" (click)="openEdit(product)"
            ></button>
            <button
              pButton type="button" text rounded severity="warn"
              icon="pi pi-ban" aria-label="Dar de baja el producto"
              pTooltip="Baja lógica" (click)="deactivate(product)"
            ></button>
            <button
              pButton type="button" text rounded severity="danger"
              icon="pi pi-trash" aria-label="Eliminar producto"
              pTooltip="Eliminar" (click)="remove(product)"
            ></button>
          </div>
        </td>
      </tr>
    </ng-template>

    <ng-template #emptymessage>
      <tr>
        <td colspan="6">
          @if (filter()) {
            <app-empty-state
              icon="pi pi-search"
              title="Sin coincidencias"
              message="Ningún producto coincide con la búsqueda. Borra el filtro para ver todos."
            />
          } @else {
            <app-empty-state
              icon="pi pi-box"
              title="Sin productos activos"
              message="Crea el primero con «Nuevo producto» o ejecuta el seeder del backend."
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
  styleClass="w-full max-w-3xl mx-4"
>
  <app-product-form
    [product]="editing()"
    [productTypes]="types()"
    [saving]="saving()"
    [resetKey]="resetKey()"
    (saved)="save($event)"
    (cancelled)="dialogVisible.set(false)"
  />
</p-dialog>
EOF
```

### 5.7.3 `product-list.css` (vacío a propósito)

```bash
cat > src/app/features/products/product-list/product-list.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 5.7.4 `product-list.spec.ts`

```bash
cat > src/app/features/products/product-list/product-list.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductList } from './product-list';
import { environment } from '../../../../environments/environment';

const PRODUCTS_URL = `${environment.apiUrl}/productos`;
const TYPES_URL = `${environment.apiUrl}/tipos-producto`;

const TYPES = [
  { id: 1, name: 'Aseo', description: null, status: 'active' as const },
  { id: 2, name: 'Congelados', description: null, status: 'active' as const },
];

const PRODUCTS = [
  { id: 1, name: 'Detergente', brand: 'Marca', price: 10, min_stock: 2, quantity: 5, product_type_id: 1, status: 'active' as const },
  { id: 2, name: 'Helado', brand: 'Frío', price: 5, min_stock: 3, quantity: 0, product_type_id: 2, status: 'active' as const },
  { id: 3, name: 'Jabón', brand: 'Marca', price: 3, min_stock: 4, quantity: 4, product_type_id: 1, status: 'active' as const },
];

describe('ProductList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductList],
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
    const fixture = TestBed.createComponent(ProductList);
    fixture.detectChanges();
    http.expectOne(TYPES_URL).flush({ product_types: TYPES });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
    await fixture.whenStable();
    return { fixture, lista: fixture.componentInstance };
  }

  it('should load products and types in parallel', async () => {
    const { fixture } = await crearLista();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(
      PRODUCTS.length,
    );
  });

  it('should resolve product_type_id to its name', async () => {
    const { lista } = await crearLista();
    expect(lista.typeName()(1)).toBe('Aseo');
    expect(lista.typeName()(99)).toBe('Tipo #99');
  });

  it('should compute lowStockCount', async () => {
    const { lista } = await crearLista();
    // quantity <= min_stock → productos 2 y 3
    expect(lista.lowStockCount()).toBe(2);
  });

  it('should filter without new HTTP calls', async () => {
    const { lista } = await crearLista();
    lista.filter.set('helado');
    expect(lista.visibleRows().length).toBe(1);
    expect(lista.visibleRows()[0].name).toBe('Helado');
    http.expectNone(PRODUCTS_URL);
  });

  it('should show an error message when GET fails', async () => {
    const fixture = TestBed.createComponent(ProductList);
    fixture.detectChanges();
    http
      .expectOne(TYPES_URL)
      .flush({ error: 'x' }, { status: 500, statusText: 'Error' });
    http
      .expectOne(PRODUCTS_URL)
      .flush({ error: 'x' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBeTruthy();
  });

  it('should POST a new product and reload both endpoints', async () => {
    const { lista } = await crearLista();
    lista.openCreate();
    lista.save({
      name: 'Limpiavidrios',
      brand: 'Marca',
      price: 8,
      min_stock: 2,
      quantity: 6,
      product_type_id: 1,
      status: 'active',
    });
    const post = http.expectOne(PRODUCTS_URL);
    expect(post.request.method).toBe('POST');
    post.flush({ product: { id: 4 } });
    // recarga
    http.expectOne(TYPES_URL).flush({ product_types: TYPES });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
  });

  it('should PATCH without status in edit mode', async () => {
    const { lista } = await crearLista();
    lista.openEdit(PRODUCTS[0]);
    lista.save({
      name: 'Detergente',
      brand: 'Marca',
      price: 10,
      min_stock: 2,
      quantity: 8,
      product_type_id: 1,
    });
    const patch = http.expectOne(`${PRODUCTS_URL}/1`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({
      name: 'Detergente',
      brand: 'Marca',
      price: 10,
      min_stock: 2,
      quantity: 8,
      product_type_id: 1,
    });
    patch.flush({ product: PRODUCTS[0] });
    http.expectOne(TYPES_URL).flush({ product_types: TYPES });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
  });

  it('should call /deactivate after confirmation', async () => {
    const { lista } = await crearLista();
    const confirmacion = TestBed.inject(ConfirmationService);
    spyOn(confirmacion, 'confirm').and.callFake((opts: any) => {
      opts.accept?.();
      return confirmacion;
    });
    lista.deactivate(PRODUCTS[0]);
    const baja = http.expectOne(`${PRODUCTS_URL}/1/deactivate`);
    expect(baja.request.method).toBe('PATCH');
    baja.flush({});
    http.expectOne(TYPES_URL).flush({ product_types: TYPES });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS.slice(1) });
  });

  it('should call DELETE for physical removal', async () => {
    const { lista } = await crearLista();
    const confirmacion = TestBed.inject(ConfirmationService);
    spyOn(confirmacion, 'confirm').and.callFake((opts: any) => {
      opts.accept?.();
      return confirmacion;
    });
    lista.remove(PRODUCTS[0]);
    const del = http.expectOne(`${PRODUCTS_URL}/1`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
    http.expectOne(TYPES_URL).flush({ product_types: TYPES });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS.slice(1) });
  });

  it('should show a toast on operation error', async () => {
    const { lista } = await crearLista();
    const mensajes = TestBed.inject(MessageService);
    spyOn(mensajes, 'add');
    lista.openCreate();
    lista.save({
      name: 'X',
      brand: 'Y',
      price: 1,
      min_stock: 0,
      quantity: 0,
      product_type_id: 1,
      status: 'active',
    });
    http
      .expectOne(PRODUCTS_URL)
      .flush({ error: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    expect(mensajes.add).toHaveBeenCalled();
  });
});
EOF
```

---

## 5.8 Ruta y menú

### 5.8.1 Editar `src/app/app.routes.ts`

Añade la ruta **debajo** de `tipos-producto`:

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
        path: 'productos',
        title: 'Productos · TextilClean',
        loadComponent: () =>
          import('./features/products/product-list/product-list').then(
            (m) => m.ProductList,
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

> Si `features/construir/` aún no existe en tu proyecto, quita ese bloque **ahora**.

### 5.8.2 Editar `src/app/layout/shell/shell.ts`

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
    { label: 'Productos', icon: 'pi pi-box', routerLink: '/productos' },
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

# 1. El servicio usa /productos
grep -n "productos" src/app/features/products/product-api.ts

# 2. El modelo tiene los campos de relación y stock
grep -n "min_stock\|quantity\|product_type_id" src/app/core/models/product.model.ts

# 3. El formulario usa optionValue="id" en el select de tipos
grep -n 'optionValue="id"' src/app/features/products/product-form/product-form.html

# 4. La lista usa forkJoin y computed
grep -n "forkJoin(\|typeName = computed\|lowStockCount = computed" \
  src/app/features/products/product-list/product-list.ts

# 5. La ruta y el menú
grep -n "productos" src/app/app.routes.ts src/app/layout/shell/shell.ts

# 6. CSS vacíos
for f in src/app/features/products/**/*.css; do
  grep -q '[{}]' "$f" && echo "REGLAS EN $f"
done

# 7. Pruebas y build
npm test -- --watch=false
ng build
```

### Comprobación funcional

```bash
# Tipos disponibles
curl -s http://localhost:4000/api/tipos-producto | head -c 300

# Productos
curl -s http://localhost:4000/api/productos | head -c 500
```

Abre `http://localhost:4200` y verifica:

| Comprobación | Resultado esperado |
|---|---|
| `/productos` por URL directa | Monta el `Shell` y la pantalla |
| Tabla | Muestra **nombre, marca, tipo (texto), precio formateado y stock** |
| Semáforo | `quantity === 0` → **rojo** (`danger`); `quantity <= min_stock` → **ámbar** (`warn`); resto → **verde** (`success`) |
| Header | Aparece la etiqueta `N con stock bajo` cuando `lowStockCount() > 0` |
| Buscador | Filtra por **nombre, marca o tipo** sin llamar al backend |
| Crear «Limpiavidrios» | `POST 201`, diálogo cerrado, toast «Producto creado», recarga |
| Crear con `stock = 0` | Aparece **en rojo** |
| Editar `stock ≤ min_stock` | Fila pasa a **ámbar** |
| Guardar sin tipo | El formulario **bloquea el envío** (validación) |
| Guardar con tipo inactivo | El backend responde `400`/`409`; el toast muestra el mensaje (`toApiMessage`) |
| Baja lógica | Confirmación «Desactivar» → desaparece del listado |
| Baja física | Confirmación «Eliminar» → desaparece del listado |

> **Nota del docente.** La verificación de escritura contra el backend `app-textilclean-express` en modo Fase II (`AUTH_ENABLED=true`) mostrará `Missing Bearer token`. Es **correcto**: el CRUD queda completamente funcional al terminar **ISS-08/ISS-09**. Mientras tanto, usa `AUTH_ENABLED=false` en el `.env` del backend.

---

## Correspondencia con el código

Archivos que **crea o reemplaza** este ISS:

- `src/app/core/models/product.model.ts` *(si no existía en ISS-02)*
- `src/app/features/products/product-api.ts` *(nuevo)*
- `src/app/features/products/product-api.spec.ts` *(nuevo)*
- `src/app/features/products/product-form/product-form.ts` *(reemplaza al generado por el CLI)*
- `src/app/features/products/product-form/product-form.html` *(reemplaza)*
- `src/app/features/products/product-form/product-form.css` *(reemplaza)*
- `src/app/features/products/product-form/product-form.spec.ts` *(nuevo)*
- `src/app/features/products/product-list/product-list.ts` *(reemplaza)*
- `src/app/features/products/product-list/product-list.html` *(reemplaza)*
- `src/app/features/products/product-list/product-list.css` *(reemplaza)*
- `src/app/features/products/product-list/product-list.spec.ts` *(nuevo)*
- `src/app/app.routes.ts` *(edita)*
- `src/app/layout/shell/shell.ts` *(edita)*
- `src/app/layout/shell/shell.html` *(edita, si aún no tenía `[items]` y `routerLink`)*

Archivos de **ISS-02/ISS-03/ISS-04 que no se tocan**: `filter-rows.ts`, `api-error.ts`, `notification.ts`, `status-tag`, `page-header`, `empty-state`, `features/clients/`, `features/product-types/`.

---

## Notas del docente

- **Primera relación many-to-one.** El producto solo guarda `product_type_id` (número). El nombre del tipo se resuelve con un `Map` construido una vez por `computed`, no con `find()` en cada fila.
- **`optionValue="id"`** es lo que hace que `p-select` envíe un `number` en el payload y no el objeto completo del tipo.
- **`forkJoin`** carga productos y tipos en paralelo: un solo `loading`, un solo `error`, sin pintar la tabla dos veces.
- **`lowStockCount`** usa `min_stock` del producto. El **dashboard de ISS-07** usa umbral fijo `5`; es una **discrepancia pendiente de decisión** y se documentará allí.
- **Semáforo**: `quantity === 0` → `danger`; `quantity <= min_stock` → `warn`; resto → `success`.
- **`status` deshabilitado al editar**: `PATCH /api/productos/:id` no cambia el estado; para eso está `/deactivate`.
- **Permisos: todavía no.** En Fase I los botones se ven siempre. En **ISS-09** se envuelven con `*appHasPermission` sin tocar la lógica del componente.

---

## Navegación

⬅️ **Anterior:** ISS-04 — CRUD de tipos de producto
⬆️ **Ruta:** Frontend-Express · Fase I · Business
➡️ **Siguiente:** ISS-06 — Venta transaccional y líneas de venta