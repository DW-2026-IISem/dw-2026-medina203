# 🛠 ISS-07 · Detalle de ventas, dashboard y cierre de Fase I

> **Proyecto frontend:** `front-textilclean-express` (carpeta real: `frontend-2026`)
> **Ruta frontend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026`
> **Proyecto backend:** `app-textilclean-express`
> **Ruta backend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express`
> **Fase:** I · Business · **Bloqueado por:** ISS-06 · **Cierra:** Fase I · **Habilita:** ISS-08
> **Vigencia:** revisión alineada con guía del docente del 23-oct-2026.
> **Capa:** 🛠 Construir (ejecutar, verificar y entregar)

---

## 0. Antes de tocar nada

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
pwd
```

Verifica que todas las piezas previas existen:

```bash
ls src/app/core/models/          # api  client  product-type  product  sale
ls src/app/core/utils/           # api-error  filter-rows
ls src/app/features/clients/     # client-api  client-form  client-list
ls src/app/features/product-types/   # product-type-api  product-type-form  product-type-list
ls src/app/features/products/        # product-api  product-form  product-list
ls src/app/features/sales/           # sale-api  sale-form  sale-list
ls src/app/shared/ui/                # page-header  empty-state  status-tag
```

Si falta algo, **detente**: vuelve a la ISS correspondiente.

---

## Objetivo y alcance

Cerrar la **Fase I** con tres piezas:

1. **Detalle de ventas** (`/api/detalle-ventas`) como CRUD independiente de líneas.
2. **`SaleDetail`** que presenta cabecera + ítems.
3. **Dashboard** que agrega clientes, tipos, productos y ventas con signals.

> Al terminar, la aplicación cubre **todo el negocio**. Contra el backend antes de su `ISS-13` funciona sin autenticación. Si apuntas al backend consolidado verás `401`: es lo esperado; el login llega en **ISS-08**, al abrir la Fase II.

**Antes de construir:** muestra el detalle con inputs → intégralo en su diálogo → añade el dashboard con datos derivados de la API.

**Evidencia de aprendizaje:** explica qué consulta la API y qué calcula `computed`; compara indicadores con datos reales.

**Equipo y terminal:** Ubuntu WSL, terminal del editor, carpeta `frontend-2026`.

---

## Criterios de aceptación (ISS-07)

- [ ] `/detalle-ventas` lista líneas con **venta y producto resueltos**.
- [ ] Crear una línea **actualiza stock y totales** de la venta (verifícalo con `curl`).
- [ ] Editar una línea **solo permite cambiar cantidad**; el estado se gestiona con la baja lógica.
- [ ] El diálogo de detalle de venta muestra **cabecera, líneas y total**.
- [ ] El dashboard carga sin errores y los **KPIs coinciden** con los listados.
- [ ] `lowStock()` y `revenue()` se recalculan al recargar los datos.
- [ ] **Fase I completa**: con el backend antes de su ISS-13 funcionan **sin autenticación**. `requireAuth` no se lee hasta ISS-08. Si usas el backend consolidado, su mitad del interruptor es `AUTH_ENABLED=false` en el `.env`; con `AUTH_ENABLED=true` estas rutas responden `401` (se resuelve en Fase II).
- [ ] `ng serve` compila sin errores.

---

## 7.1 Detalle de ventas: endpoint delicado

| Operación | Ruta | Efecto en stock/totales |
|---|---|---|
| Listar líneas | `GET /api/detalle-ventas` | Ninguno |
| Crear línea | `POST /api/detalle-ventas` | **Descuenta stock** y recalcula la venta |
| Cambiar cantidad | `PATCH /api/detalle-ventas/:id` | Ajusta stock y totales |
| Baja lógica | `PATCH /api/detalle-ventas/:id/deactivate` | **Restaura stock** y recalcula la venta |
| Baja física | `DELETE /api/detalle-ventas/:id` | Elimina la línea y **restaura stock** |

> **Decisión de diseño.** El flujo normal de negocio es crear la venta completa con `POST /api/ventas` (ISS-06). `/detalle-ventas` existe para el laboratorio y para **corregir líneas**. Si agregas una línea aquí, el backend **recalcula la cabecera**. No lo uses para “crear una venta desde cero”.

> ⚠️ **Frontera con Fase II.** Las rutas Express de escritura existen, pero el **catálogo RBAC** del backend **solo concede `GET /api/detalle-ventas`**. Contra el backend consolidado, `POST/PATCH/DELETE` de esta pantalla responderán **`403`** incluso con `admin`. En Fase I se implementan y prueban completos; **ISS-09** los ocultará por permiso (solo lectura) y dejará la escritura en `POST /api/ventas`. Si tu entrega necesita CRUD de detalle en Fase II, **primero amplía `resource-catalog.ts`** en el backend.

---

## 7.2 Generar los cuatro componentes

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
ng generate component features/product-sales/product-sale-list --skip-tests --defaults
ng generate component features/product-sales/product-sale-form --skip-tests --defaults
ng generate component features/sales/sale-detail --skip-tests --defaults
ng generate component features/dashboard --skip-tests --defaults
```

Comprueba la estructura:

```bash
ls -R src/app/features/product-sales/ src/app/features/sales/ src/app/features/dashboard/
```

Debe quedar así (los `.spec.ts` se sobrescriben más abajo):

```
src/app/features/product-sales/
├── product-sale-api.ts
├── product-sale-api.spec.ts
├── product-sale-form/
│   ├── product-sale-form.ts
│   ├── product-sale-form.html
│   ├── product-sale-form.css
│   └── product-sale-form.spec.ts
└── product-sale-list/
    ├── product-sale-list.ts
    ├── product-sale-list.html
    ├── product-sale-list.css
    └── product-sale-list.spec.ts

src/app/features/sales/
└── sale-detail/                 # nuevo (junto a sale-form/ y sale-list/)

src/app/features/dashboard/
├── dashboard.ts
├── dashboard.html
├── dashboard.css
└── dashboard.spec.ts
```

---

## 7.3 Modelo de línea

```bash
cat > src/app/core/models/product-sale.model.ts <<'EOF'
import { Status } from './api.model';
import { Money, Timestamps } from './product.model';

/** Línea de venta (detalle independiente de /api/detalle-ventas). */
export interface ProductSale extends Timestamps {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: Money;
  line_total: Money;
  status: Status;
}

/**
 * Payload de alta. En edición solo se envía `{ quantity }`:
 * el resto lo gobierna el backend (/deactivate para el estado).
 */
export interface ProductSalePayload {
  sale_id: number;
  product_id: number;
  quantity: number;
  status?: Status;
}
EOF
```

También añade un helper de normalización reutilizable:

```bash
cat > src/app/core/utils/to-number.ts <<'EOF'
import { Money } from '../models/product.model';

/**
 * Normaliza un DECIMAL (`number | string | null`) a `number`.
 *
 * El backend puede devolver `"12.50"` en lugar de `12.5`. Sumar strings
 * produce `"012.5015.00"`; este helper evita esa trampa.
 */
export function toNumber(value: Money | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return typeof value === 'number' ? value : Number.parseFloat(value) || 0;
}
EOF
```

---

## 7.4 Servicio

```bash
cat > src/app/features/product-sales/product-sale-api.ts <<'EOF'
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProductSale,
  ProductSalePayload,
} from '../../core/models/product-sale.model';

/** /api/detalle-ventas — agregar/editar líneas ajusta stock y totales. */
@Injectable({ providedIn: 'root' })
export class ProductSaleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/detalle-ventas`;

  list(): Observable<ProductSale[]> {
    return this.http
      .get<{ product_sales: ProductSale[] }>(this.base)
      .pipe(map((response) => response.product_sales));
  }

  get(id: number): Observable<ProductSale> {
    return this.http
      .get<{ product_sale: ProductSale }>(`${this.base}/${id}`)
      .pipe(map((response) => response.product_sale));
  }

  create(payload: ProductSalePayload): Observable<ProductSale> {
    return this.http
      .post<{ product_sale: ProductSale }>(this.base, payload)
      .pipe(map((response) => response.product_sale));
  }

  /** PATCH solo acepta `quantity`: el estado se cambia con `/deactivate`. */
  update(id: number, payload: { quantity: number }): Observable<ProductSale> {
    return this.http
      .patch<{ product_sale: ProductSale }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.product_sale));
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
cat > src/app/features/product-sales/product-sale-api.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ProductSaleApi } from './product-sale-api';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/detalle-ventas`;

describe('ProductSaleApi', () => {
  let api: ProductSaleApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProductSaleApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps product_sales from list()', () => {
    let out: unknown;
    api.list().subscribe((r) => (out = r));
    http.expectOne(BASE).flush({ product_sales: [{ id: 1 }] });
    expect(out).toEqual([{ id: 1 }]);
  });

  it('PATCHes only quantity', () => {
    api.update(2, { quantity: 3 }).subscribe();
    const req = http.expectOne(`${BASE}/2`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ quantity: 3 });
    req.flush({ product_sale: { id: 2 } });
  });

  it('PATCHes /deactivate', () => {
    api.deactivate(2).subscribe();
    const req = http.expectOne(`${BASE}/2/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('DELETEs physically', () => {
    api.remove(2).subscribe();
    const req = http.expectOne(`${BASE}/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
EOF
```

---

## 7.5 Formulario de línea

En **edición** solo se permite cambiar `quantity`; `sale_id`, `product_id` y `status` se **deshabilitan** porque el backend no los actualiza por `PATCH`.

### 7.5.1 `product-sale-form.ts`

```bash
cat > src/app/features/product-sales/product-sale-form/product-sale-form.ts <<'EOF'
import { Component, effect, inject, input, output } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Status } from '../../../core/models/api.model';
import { Product } from '../../../core/models/product.model';
import {
  ProductSale,
  ProductSalePayload,
} from '../../../core/models/product-sale.model';
import { Sale } from '../../../core/models/sale.model';

@Component({
  host: { class: 'block' },
  selector: 'app-product-sale-form',
  imports: [
    ButtonModule,
    InputNumberModule,
    MessageModule,
    ReactiveFormsModule,
    SelectModule,
  ],
  templateUrl: './product-sale-form.html',
  styleUrl: './product-sale-form.css',
})
export class ProductSaleForm {
  readonly line = input<ProductSale | null>(null);
  readonly sales = input<Sale[]>([]);
  readonly products = input<Product[]>([]);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<ProductSalePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    sale_id: [null as number | null, [Validators.required]],
    product_id: [null as number | null, [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.line();
      this.resetKey();

      this.form.reset({
        sale_id: current?.sale_id ?? null,
        product_id: current?.product_id ?? null,
        quantity: current?.quantity ?? 1,
        status: current?.status ?? 'active',
      });

      if (current) {
        this.form.controls.sale_id.disable();
        this.form.controls.product_id.disable();
        this.form.controls.status.disable();
      } else {
        this.form.controls.sale_id.enable();
        this.form.controls.product_id.enable();
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
      sale_id: Number(value.sale_id),
      product_id: Number(value.product_id),
      quantity: Number(value.quantity),
      // `status` solo al crear; en edición se usa /deactivate.
      ...(this.line() ? {} : { status: value.status }),
    });
  }
}
EOF
```

### 7.5.2 `product-sale-form.html`

```bash
cat > src/app/features/product-sales/product-sale-form/product-sale-form.html <<'EOF'
<form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
  <div>
    <label for="ps-sale" class="mb-1 block text-sm font-medium text-slate-700">
      Venta <span class="text-red-500">*</span>
    </label>
    <p-select
      inputId="ps-sale"
      formControlName="sale_id"
      [options]="sales()"
      optionLabel="id"
      optionValue="id"
      placeholder="Selecciona una venta"
      [filter]="true"
      [fluid]="true"
    />
  </div>

  <div>
    <label for="ps-product" class="mb-1 block text-sm font-medium text-slate-700">
      Producto <span class="text-red-500">*</span>
    </label>
    <p-select
      inputId="ps-product"
      formControlName="product_id"
      [options]="products()"
      optionLabel="name"
      optionValue="id"
      placeholder="Selecciona un producto"
      [filter]="true"
      [fluid]="true"
    />
  </div>

  <div>
    <label for="ps-qty" class="mb-1 block text-sm font-medium text-slate-700">
      Cantidad <span class="text-red-500">*</span>
    </label>
    <p-inputnumber
      inputId="ps-qty"
      formControlName="quantity"
      [min]="1"
      [showButtons]="true"
      [fluid]="true"
    />
    @if (form.controls.quantity.touched && form.controls.quantity.invalid) {
      <p-message severity="error" size="small" variant="simple" styleClass="mt-1">
        La cantidad debe ser al menos 1.
      </p-message>
    }
  </div>

  <div>
    <label for="ps-status" class="mb-1 block text-sm font-medium text-slate-700">
      Estado
    </label>
    <p-select
      inputId="ps-status"
      formControlName="status"
      [options]="statusOptions"
      optionLabel="label"
      optionValue="value"
      [fluid]="true"
    />
    @if (line()) {
      <p class="mt-1 text-xs text-slate-500">
        El estado de una línea existente solo cambia con la baja lógica.
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

### 7.5.3 `product-sale-form.css` (vacío a propósito)

```bash
cat > src/app/features/product-sales/product-sale-form/product-sale-form.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 7.5.4 `product-sale-form.spec.ts`

```bash
cat > src/app/features/product-sales/product-sale-form/product-sale-form.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { ProductSaleForm } from './product-sale-form';

const SALES = [{ id: 10 }, { id: 11 }] as any[];
const PRODUCTS = [
  { id: 1, name: 'Detergente' },
  { id: 2, name: 'Jabón' },
] as any[];

const LINE = {
  id: 1, sale_id: 10, product_id: 1, quantity: 2,
  unit_price: 10, line_total: 20, status: 'active' as const,
};

describe('ProductSaleForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductSaleForm],
    }).compileComponents();
  });

  function crear(line: typeof LINE | null = null) {
    const fixture = TestBed.createComponent(ProductSaleForm);
    fixture.componentRef.setInput('line', line);
    fixture.componentRef.setInput('sales', SALES);
    fixture.componentRef.setInput('products', PRODUCTS);
    fixture.detectChanges();
    return fixture;
  }

  it('should start in creation mode with status enabled', () => {
    const fixture = crear(null);
    expect(fixture.componentInstance.form.controls.status.enabled).toBe(true);
  });

  it('should load line and disable non-editable controls', () => {
    const fixture = crear(LINE);
    const form = fixture.componentInstance.form;
    expect(form.controls.sale_id.disabled).toBe(true);
    expect(form.controls.product_id.disabled).toBe(true);
    expect(form.controls.status.disabled).toBe(true);
  });

  it('should emit creation payload with status', () => {
    const fixture = crear(null);
    const out: unknown[] = [];
    fixture.componentInstance.saved.subscribe((p) => out.push(p));

    fixture.componentInstance.form.patchValue({
      sale_id: 10, product_id: 1, quantity: 2, status: 'active',
    });
    fixture.componentInstance.submit();

    expect(out).toEqual([
      { sale_id: 10, product_id: 1, quantity: 2, status: 'active' },
    ]);
  });

  it('should emit edit payload without status', () => {
    const fixture = crear(LINE);
    const out: unknown[] = [];
    fixture.componentInstance.saved.subscribe((p) => out.push(p));

    fixture.componentInstance.form.patchValue({ quantity: 5 });
    fixture.componentInstance.submit();

    expect(out).toEqual([{ sale_id: 10, product_id: 1, quantity: 5 }]);
  });
});
EOF
```

En **`ProductSaleList.save(value)`** el padre decide:

```ts
const request = current
  ? this.api.update(current.id, { quantity: value.quantity })
  : this.api.create(value);
```

---

## 7.6 SaleDetail: cabecera + líneas

`SaleDetail` es un **componente presentacional** (no llama al backend). Recibe la venta ya cargada desde `SaleList` y resuelve nombres de producto con un `Map`.

### 7.6.1 `sale-detail.ts`

```bash
cat > src/app/features/sales/sale-detail/sale-detail.ts <<'EOF'
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Product } from '../../../core/models/product.model';
import { Sale } from '../../../core/models/sale.model';
import { toNumber } from '../../../core/utils/to-number';

@Component({
  host: { class: 'block' },
  selector: 'app-sale-detail',
  imports: [CurrencyPipe, DatePipe, TableModule, TagModule],
  templateUrl: './sale-detail.html',
  styleUrl: './sale-detail.css',
})
export class SaleDetail {
  readonly sale = input.required<Sale>();
  readonly products = input<Product[]>([]);

  readonly productName = computed(() => {
    const map = new Map(this.products().map((p) => [p.id, p.name]));
    return (id: number) => map.get(id) ?? `Producto #${id}`;
  });

  readonly itemCount = computed(() =>
    (this.sale().items ?? []).reduce((sum, item) => sum + item.quantity, 0),
  );

  readonly totalAsNumber = computed(() => toNumber(this.sale().total));
}
EOF
```

### 7.6.2 `sale-detail.html`

```bash
cat > src/app/features/sales/sale-detail/sale-detail.html <<'EOF'
<div class="space-y-4">
  <div class="grid gap-2 sm:grid-cols-2">
    <p class="text-sm text-slate-500">
      Venta <strong>#{{ sale().id }}</strong>
    </p>
    <p class="text-sm text-slate-500 sm:text-right">
      {{ sale().created_at | date: 'short' }}
    </p>
    <p class="text-sm text-slate-500">
      Cliente <strong>#{{ sale().client_id }}</strong>
    </p>
    <p class="text-sm text-slate-500 sm:text-right">
      <p-tag [value]="sale().status" severity="secondary" [rounded]="true" />
    </p>
  </div>

  <div class="rounded-xl border border-slate-200">
    <p-table [value]="sale().items ?? []" dataKey="id" tableStyleClass="min-w-2xl">
      <ng-template #header>
        <tr>
          <th>Producto</th>
          <th class="text-right">Cantidad</th>
          <th class="text-right">Precio</th>
          <th class="text-right">Línea</th>
        </tr>
      </ng-template>
      <ng-template #body let-item>
        <tr>
          <td>{{ productName()(item.product_id) }}</td>
          <td class="text-right">{{ item.quantity }}</td>
          <td class="text-right">
            {{ item.unit_price | currency: 'USD' : 'symbol' : '1.2-2' }}
          </td>
          <td class="text-right font-medium">
            {{ item.line_total | currency: 'USD' : 'symbol' : '1.2-2' }}
          </td>
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr>
          <td colspan="4" class="p-4 text-center text-sm text-slate-500">
            Esta venta no tiene líneas activas.
          </td>
        </tr>
      </ng-template>
    </p-table>
  </div>

  <dl class="space-y-1 text-sm">
    <div class="flex justify-between">
      <dt class="text-slate-500">Subtotal</dt>
      <dd>{{ sale().subtotal | currency: 'USD' : 'symbol' : '1.2-2' }}</dd>
    </div>
    <div class="flex justify-between">
      <dt class="text-slate-500">Impuesto</dt>
      <dd>{{ sale().tax | currency: 'USD' : 'symbol' : '1.2-2' }}</dd>
    </div>
    <div class="flex justify-between">
      <dt class="text-slate-500">Descuento</dt>
      <dd>-{{ sale().discounts | currency: 'USD' : 'symbol' : '1.2-2' }}</dd>
    </div>
    <div class="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
      <dt>Total</dt>
      <dd>{{ sale().total | currency: 'USD' : 'symbol' : '1.2-2' }}</dd>
    </div>
  </dl>

  <p class="text-xs text-slate-400">
    {{ itemCount() }} unidades en {{ (sale().items ?? []).length }} líneas.
  </p>
</div>
EOF
```

### 7.6.3 `sale-detail.css` (vacío a propósito)

```bash
cat > src/app/features/sales/sale-detail/sale-detail.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 7.6.4 Integrar `SaleDetail` en `SaleList`

En `sale-list.ts`, añade:

```ts
readonly detailVisible = signal(false);
readonly selected = signal<Sale | null>(null);

readonly detailTitle = computed(() => {
  const s = this.selected();
  return s ? `Venta #${s.id}` : 'Detalle';
});

openDetail(sale: Sale): void {
  this.selected.set(sale);
  this.detailVisible.set(true);
}
```

Y en `sale-list.html`, justo encima de `<p-dialog>` de acciones (o al final):

```html
<p-dialog
  [visible]="detailVisible()"
  (visibleChange)="detailVisible.set($event)"
  [header]="detailTitle()"
  [modal]="true"
  styleClass="w-full max-w-2xl mx-4"
>
  @if (selected(); as sale) {
    <app-sale-detail [sale]="sale" [products]="products()" />
  }
</p-dialog>
```

Añade también un botón de **ver detalle** en la columna de acciones:

```html
<button
  pButton type="button" text rounded severity="info"
  icon="pi pi-eye" aria-label="Ver detalle"
  pTooltip="Ver detalle" (click)="openDetail(sale)"
></button>
```

> `input.required<Sale>()` garantiza que el padre **no olvide** pasar la venta. Si el `@if` es falso, el componente **no se instancia** y no hay error.

---

## 7.7 Listado de líneas (`ProductSaleList`)

### 7.7.1 `product-sale-list.ts`

```bash
cat > src/app/features/product-sales/product-sale-list/product-sale-list.ts <<'EOF'
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { Product } from '../../../core/models/product.model';
import {
  ProductSale,
  ProductSalePayload,
} from '../../../core/models/product-sale.model';
import { Sale } from '../../../core/models/sale.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { ProductApi } from '../../products/product-api';
import { SaleApi } from '../../sales/sale-api';
import { ProductSaleApi } from '../product-sale-api';
import { ProductSaleForm } from '../product-sale-form/product-sale-form';

@Component({
  host: { class: 'block' },
  selector: 'app-product-sale-list',
  imports: [
    ButtonModule,
    CurrencyPipe,
    DialogModule,
    EmptyState,
    MessageModule,
    PageHeader,
    ProductSaleForm,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './product-sale-list.html',
  styleUrl: './product-sale-list.css',
})
export class ProductSaleList {
  private readonly api = inject(ProductSaleApi);
  private readonly salesApi = inject(SaleApi);
  private readonly productsApi = inject(ProductApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<ProductSale[]>([]);
  readonly sales = signal<Sale[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly dialogVisible = signal(false);
  readonly editing = signal<ProductSale | null>(null);
  readonly resetKey = signal(0);

  readonly title = computed(() =>
    this.editing() ? 'Editar línea' : 'Nueva línea',
  );

  readonly productName = computed(() => {
    const map = new Map(this.products().map((p) => [p.id, p.name]));
    return (id: number) => map.get(id) ?? `Producto #${id}`;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      lines: this.api.list(),
      sales: this.salesApi.list(),
      products: this.productsApi.list(),
    }).subscribe({
      next: ({ lines, sales, products }) => {
        this.rows.set(lines);
        this.sales.set(sales);
        this.products.set(products);
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
    this.resetKey.update((k) => k + 1);
    this.dialogVisible.set(true);
  }

  openEdit(line: ProductSale): void {
    this.editing.set(line);
    this.resetKey.update((k) => k + 1);
    this.dialogVisible.set(true);
  }

  save(value: ProductSalePayload): void {
    const current = this.editing();
    this.saving.set(true);

    const request = current
      ? this.api.update(current.id, { quantity: value.quantity })
      : this.api.create(value);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(
          current ? 'Línea actualizada' : 'Línea creada',
        );
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(line: ProductSale): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar la línea #${line.id}? El stock se restaura.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(line.id).subscribe({
          next: () => {
            this.notify.warn('Línea desactivada');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo desactivar', toApiMessage(error));
          },
        });
      },
    });
  }

  remove(line: ProductSale): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará la línea #${line.id}. El stock se restaura.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(line.id).subscribe({
          next: () => {
            this.notify.success('Línea eliminada');
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

### 7.7.2 `product-sale-list.html`

```bash
cat > src/app/features/product-sales/product-sale-list/product-sale-list.html <<'EOF'
<app-page-header
  title="Detalle de ventas"
  subtitle="Corrige líneas. Crear, editar o eliminar ajusta el stock y los totales de la venta."
>
  <button pButton type="button" (click)="openCreate()">
    <i pButtonIcon class="pi pi-plus"></i>
    <span pButtonLabel>Nueva línea</span>
  </button>
</app-page-header>

@if (error()) {
  <p-message severity="error" styleClass="mb-4 w-full">{{ error() }}</p-message>
}

<div class="rounded-xl border border-slate-200 bg-white">
  <p-table
    [value]="rows()"
    [loading]="loading()"
    [paginator]="rows().length > 10"
    [rows]="10"
    dataKey="id"
    tableStyleClass="min-w-4xl"
  >
    <ng-template #header>
      <tr>
        <th>#</th>
        <th>Venta</th>
        <th>Producto</th>
        <th class="text-right">Cantidad</th>
        <th class="text-right">Precio</th>
        <th class="text-right">Total línea</th>
        <th>Estado</th>
        <th class="w-40 text-right">Acciones</th>
      </tr>
    </ng-template>
    <ng-template #body let-line>
      <tr>
        <td class="text-slate-500">#{{ line.id }}</td>
        <td>#{{ line.sale_id }}</td>
        <td>{{ productName()(line.product_id) }}</td>
        <td class="text-right">{{ line.quantity }}</td>
        <td class="text-right">
          {{ line.unit_price | currency: 'USD' : 'symbol' : '1.2-2' }}
        </td>
        <td class="text-right font-medium">
          {{ line.line_total | currency: 'USD' : 'symbol' : '1.2-2' }}
        </td>
        <td><app-status-tag [status]="line.status" /></td>
        <td>
          <div class="flex justify-end gap-1">
            <button
              pButton type="button" text rounded severity="secondary"
              icon="pi pi-pencil" aria-label="Editar línea"
              pTooltip="Editar" (click)="openEdit(line)"
            ></button>
            <button
              pButton type="button" text rounded severity="warn"
              icon="pi pi-ban" aria-label="Baja lógica"
              pTooltip="Baja lógica" (click)="deactivate(line)"
            ></button>
            <button
              pButton type="button" text rounded severity="danger"
              icon="pi pi-trash" aria-label="Eliminar línea"
              pTooltip="Eliminar" (click)="remove(line)"
            ></button>
          </div>
        </td>
      </tr>
    </ng-template>
    <ng-template #emptymessage>
      <tr>
        <td colspan="8">
          <app-empty-state
            icon="pi pi-list"
            title="Sin líneas"
            message="Crea la primera con «Nueva línea»."
          />
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
  <app-product-sale-form
    [line]="editing()"
    [sales]="sales()"
    [products]="products()"
    [saving]="saving()"
    [resetKey]="resetKey()"
    (saved)="save($event)"
    (cancelled)="dialogVisible.set(false)"
  />
</p-dialog>
EOF
```

### 7.7.3 `product-sale-list.css` (vacío a propósito)

```bash
cat > src/app/features/product-sales/product-sale-list/product-sale-list.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 7.7.4 `product-sale-list.spec.ts`

```bash
cat > src/app/features/product-sales/product-sale-list/product-sale-list.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductSaleList } from './product-sale-list';
import { environment } from '../../../../environments/environment';

const LINES_URL = `${environment.apiUrl}/detalle-ventas`;
const SALES_URL = `${environment.apiUrl}/ventas`;
const PRODUCTS_URL = `${environment.apiUrl}/productos`;

const LINES = [
  { id: 1, sale_id: 10, product_id: 1, quantity: 2, unit_price: 10, line_total: 20, status: 'active' as const },
];
const SALES = [{ id: 10, total: 20, status: 'active' as const }];
const PRODUCTS = [{ id: 1, name: 'Detergente', price: 10, status: 'active' as const }];

describe('ProductSaleList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductSaleList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        ConfirmationService,
        providePrimeNG({ theme: { preset: Aura } }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function crearLista() {
    const fixture = TestBed.createComponent(ProductSaleList);
    fixture.detectChanges();
    http.expectOne(LINES_URL).flush({ product_sales: LINES });
    http.expectOne(SALES_URL).flush({ sales: SALES });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
    await fixture.whenStable();
    return { fixture, lista: fixture.componentInstance };
  }

  it('should resolve product name', async () => {
    const { lista } = await crearLista();
    expect(lista.productName()(1)).toBe('Detergente');
    expect(lista.productName()(99)).toBe('Producto #99');
  });

  it('should PATCH only quantity in edit mode', async () => {
    const { lista } = await crearLista();
    lista.openEdit(LINES[0]);
    lista.save({ sale_id: 10, product_id: 1, quantity: 5 });
    const patch = http.expectOne(`${LINES_URL}/1`);
    expect(patch.request.body).toEqual({ quantity: 5 });
    patch.flush({ product_sale: LINES[0] });
    http.expectOne(LINES_URL).flush({ product_sales: LINES });
    http.expectOne(SALES_URL).flush({ sales: SALES });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
  });

  it('should call /deactivate after confirmation', async () => {
    const { lista } = await crearLista();
    const confirmacion = TestBed.inject(ConfirmationService);
    spyOn(confirmacion, 'confirm').and.callFake((opts: any) => {
      opts.accept?.();
      return confirmacion;
    });
    lista.deactivate(LINES[0]);
    const baja = http.expectOne(`${LINES_URL}/1/deactivate`);
    expect(baja.request.method).toBe('PATCH');
    baja.flush({});
    http.expectOne(LINES_URL).flush({ product_sales: [] });
    http.expectOne(SALES_URL).flush({ sales: SALES });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
  });
});
EOF
```

---

## 7.8 Dashboard: cuatro peticiones en paralelo

### 7.8.1 `dashboard.ts`

```bash
cat > src/app/features/dashboard/dashboard.ts <<'EOF'
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { forkJoin } from 'rxjs';
import { Client } from '../../core/models/client.model';
import { Product } from '../../core/models/product.model';
import { ProductType } from '../../core/models/product-type.model';
import { Sale } from '../../core/models/sale.model';
import { toApiMessage } from '../../core/utils/api-error';
import { toNumber } from '../../core/utils/to-number';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { StatusTag } from '../../shared/ui/status-tag/status-tag';
import { ClientApi } from '../clients/client-api';
import { ProductTypeApi } from '../product-types/product-type-api';
import { ProductApi } from '../products/product-api';
import { SaleApi } from '../sales/sale-api';

@Component({
  host: { class: 'block' },
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    CardModule,
    CurrencyPipe,
    DatePipe,
    MessageModule,
    PageHeader,
    RouterLink,
    SkeletonModule,
    StatusTag,
    TableModule,
    TagModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly clientsApi = inject(ClientApi);
  private readonly typesApi = inject(ProductTypeApi);
  private readonly productsApi = inject(ProductApi);
  private readonly salesApi = inject(SaleApi);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly clients = signal<Client[]>([]);
  readonly types = signal<ProductType[]>([]);
  readonly products = signal<Product[]>([]);
  readonly sales = signal<Sale[]>([]);

  readonly lowStock = computed(() =>
    this.products().filter((p) => p.quantity <= p.min_stock),
  );

  readonly revenue = computed(() =>
    this.sales().reduce((sum, sale) => sum + toNumber(sale.total), 0),
  );

  readonly latestSales = computed(() =>
    [...this.sales()]
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      )
      .slice(0, 5),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      clients: this.clientsApi.list(),
      types: this.typesApi.list(),
      products: this.productsApi.list(),
      sales: this.salesApi.list(),
    }).subscribe({
      next: ({ clients, types, products, sales }) => {
        this.clients.set(clients);
        this.types.set(types);
        this.products.set(products);
        this.sales.set(sales);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }
}
EOF
```

> ⚠️ **Discrepancia documentada** en el material del docente: el dashboard consolidado usa **umbral fijo `5`** para el stock bajo, mientras que el criterio de producto (`ISS-05`) usa `min_stock`. **Aquí respetamos `min_stock`** para no crear dos fuentes de verdad. En Fase II, cuando se estabilice el dashboard, se alineará con `ISS-09`/`ISS-11`. **Documenta la decisión** en la evidencia.
>
> ⚠️ **Otra discrepancia documentada**: el dashboard consolidado consulta el permiso `GET api/product-types/`, que **no coincide** con `GET /api/tipos-producto` del catálogo Express. El conteo de tipos puede quedar en `0` con auth activa. En **Fase I** no hay auth, así que aquí `types` se carga siempre. En **ISS-09** se ajusta el permiso al path real (`GET /api/tipos-producto`).

### 7.8.2 `dashboard.html`

```bash
cat > src/app/features/dashboard/dashboard.html <<'EOF'
<app-page-header
  title="Panel"
  subtitle="Resumen de negocio. Los indicadores se recalculan al recargar."
>
  <button pButton type="button" severity="secondary" outlined (click)="load()">
    <i pButtonIcon class="pi pi-refresh"></i>
    <span pButtonLabel>Recargar</span>
  </button>
</app-page-header>

@if (error()) {
  <p-message severity="error" styleClass="mb-4 w-full">{{ error() }}</p-message>
}

@if (loading()) {
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    @for (i of [1, 2, 3, 4]; track i) {
      <p-skeleton height="6rem" borderRadius="1rem" />
    }
  </div>
} @else {
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <p-card>
      <p class="text-xs uppercase tracking-wider text-slate-500">Clientes</p>
      <p class="mt-1 text-3xl font-semibold">{{ clients().length }}</p>
    </p-card>
    <p-card>
      <p class="text-xs uppercase tracking-wider text-slate-500">Tipos</p>
      <p class="mt-1 text-3xl font-semibold">{{ types().length }}</p>
    </p-card>
    <p-card>
      <p class="text-xs uppercase tracking-wider text-slate-500">Productos</p>
      <p class="mt-1 text-3xl font-semibold">{{ products().length }}</p>
    </p-card>
    <p-card>
      <p class="text-xs uppercase tracking-wider text-slate-500">Ingresos</p>
      <p class="mt-1 text-3xl font-semibold">
        {{ revenue() | currency: 'USD' : 'symbol' : '1.2-2' }}
      </p>
    </p-card>
  </div>

  <p-card header="Stock bajo" styleClass="mt-6">
    @if (lowStock().length === 0) {
      <p class="text-sm text-slate-500">Todos los productos tienen stock saludable.</p>
    } @else {
      <p-table [value]="lowStock()" dataKey="id" tableStyleClass="min-w-2xl">
        <ng-template #header>
          <tr>
            <th>Producto</th>
            <th class="text-right">Stock</th>
            <th class="text-right">Mínimo</th>
          </tr>
        </ng-template>
        <ng-template #body let-product>
          <tr>
            <td>{{ product.name }}</td>
            <td class="text-right">
              <p-tag
                [value]="product.quantity.toString()"
                [severity]="product.quantity === 0 ? 'danger' : 'warn'"
                [rounded]="true"
              />
            </td>
            <td class="text-right text-slate-500">{{ product.min_stock }}</td>
          </tr>
        </ng-template>
      </p-table>
    }
  </p-card>

  <p-card header="Últimas ventas" styleClass="mt-6">
    @if (latestSales().length === 0) {
      <p class="text-sm text-slate-500">Aún no hay ventas registradas.</p>
    } @else {
      <p-table [value]="latestSales()" dataKey="id" tableStyleClass="min-w-2xl">
        <ng-template #header>
          <tr>
            <th>#</th>
            <th>Fecha</th>
            <th class="text-right">Total</th>
            <th>Estado</th>
          </tr>
        </ng-template>
        <ng-template #body let-sale>
          <tr>
            <td>#{{ sale.id }}</td>
            <td class="text-sm text-slate-600">
              {{ sale.created_at | date: 'short' }}
            </td>
            <td class="text-right font-medium">
              {{ sale.total | currency: 'USD' : 'symbol' : '1.2-2' }}
            </td>
            <td><app-status-tag [status]="sale.status" /></td>
          </tr>
        </ng-template>
      </p-table>
      <div class="mt-4 text-right">
        <button pButton type="button" severity="secondary" outlined routerLink="/ventas">
          <span pButtonLabel>Ver todas las ventas</span>
        </button>
      </div>
    }
  </p-card>
}
EOF
```

### 7.8.3 `dashboard.css` (vacío a propósito)

```bash
cat > src/app/features/dashboard/dashboard.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 7.8.4 `dashboard.spec.ts`

```bash
cat > src/app/features/dashboard/dashboard.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { Dashboard } from './dashboard';
import { environment } from '../../../environments/environment';

const CLIENTS_URL = `${environment.apiUrl}/clientes`;
const TYPES_URL = `${environment.apiUrl}/tipos-producto`;
const PRODUCTS_URL = `${environment.apiUrl}/productos`;
const SALES_URL = `${environment.apiUrl}/ventas`;

describe('Dashboard', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        providePrimeNG({ theme: { preset: Aura } }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function crear() {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    http.expectOne(CLIENTS_URL).flush({ clients: [{ id: 1 }] });
    http.expectOne(TYPES_URL).flush({ product_types: [{ id: 1 }, { id: 2 }] });
    http.expectOne(PRODUCTS_URL).flush({
      products: [
        { id: 1, name: 'Detergente', quantity: 1, min_stock: 3, status: 'active' },
        { id: 2, name: 'Jabón', quantity: 5, min_stock: 2, status: 'active' },
      ],
    });
    http.expectOne(SALES_URL).flush({
      sales: [
        { id: 10, total: '25.50', status: 'active', created_at: '2026-01-01T00:00:00Z' },
        { id: 11, total: 10, status: 'active', created_at: '2026-02-01T00:00:00Z' },
      ],
    });
    await fixture.whenStable();
    return fixture.componentInstance;
  }

  it('should compute lowStock by min_stock', async () => {
    const dash = await crear();
    expect(dash.lowStock().map((p) => p.name)).toEqual(['Detergente']);
  });

  it('should sum revenue normalizing DECIMAL strings', async () => {
    const dash = await crear();
    expect(dash.revenue()).toBe(35.5);
  });

  it('should sort latest sales by date desc', async () => {
    const dash = await crear();
    expect(dash.latestSales().map((s) => s.id)).toEqual([11, 10]);
  });
});
EOF
```

---

## 7.9 Rutas y menú

### 7.9.1 Editar `src/app/app.routes.ts`

```bash
cat > src/app/app.routes.ts <<'EOF'
import { Routes } from '@angular/router';

export const routes: Routes = [
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
      {
        path: 'construir',
        title: 'Prototipo · TextilClean',
        loadComponent: () =>
          import('./features/construir/construir').then((m) => m.Construir),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
EOF
```

> `**` ahora redirige a `/dashboard` en lugar de `/clientes`. Es el cierre de Fase I.

### 7.9.2 Editar `src/app/layout/shell/shell.ts`

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
    {
      label: 'Tipos de producto',
      icon: 'pi pi-tags',
      routerLink: '/tipos-producto',
    },
    { label: 'Productos', icon: 'pi pi-box', routerLink: '/productos' },
    { label: 'Ventas', icon: 'pi pi-shopping-cart', routerLink: '/ventas' },
    {
      label: 'Detalle de ventas',
      icon: 'pi pi-list',
      routerLink: '/detalle-ventas',
    },
    { label: 'Prototipo', icon: 'pi pi-desktop', routerLink: '/construir' },
  ];

  protected onMenuToggle(): void {
    this.mobileOpen.update((v) => !v);
  }
}
EOF
```

---

## Verificación del ISS

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026

# 1. Servicio de detalle
grep -n "detalle-ventas" src/app/features/product-sales/product-sale-api.ts

# 2. Formulario solo permite quantity en edición (sale_id, product_id, status deshabilitados)
grep -n "controls.sale_id.disable\|controls.product_id.disable\|controls.status.disable" \
  src/app/features/product-sales/product-sale-form/product-sale-form.ts

# 3. SaleDetail usa input.required
grep -n "input.required<Sale>" src/app/features/sales/sale-detail/sale-detail.ts

# 4. Dashboard usa forkJoin, toNumber y computed
grep -n "forkJoin(\|toNumber(\|lowStock = computed\|revenue = computed" \
  src/app/features/dashboard/dashboard.ts

# 5. Plantillas PrimeNG 22 (sin pTemplate)
grep -rn "pTemplate=" src/app/features/product-sales/ src/app/features/dashboard/ src/app/features/sales/sale-detail/ || echo "sin pTemplate: correcto"

# 6. Rutas y menú
grep -n "dashboard\|detalle-ventas" src/app/app.routes.ts src/app/layout/shell/shell.ts

# 7. CSS vacíos
for f in src/app/features/product-sales/**/*.css src/app/features/dashboard/*.css src/app/features/sales/sale-detail/*.css; do
  grep -q '[{}]' "$f" && echo "REGLAS EN $f"
done

# 8. Pruebas y build
npm test -- --watch=false
ng build
```

### Comprobación de cierre de Fase I

```bash
# 1. Build de producción
ng build

# 2. Endpoints de negocio
for path in clientes tipos-producto productos ventas detalle-ventas; do
  echo "== $path"
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:4000/api/$path"
done
```

Todos deben responder **`200`**. Si responden **`401`**, el backend ya está en modo Fase II: **no es un fallo de Fase I**, es la señal de continuar con **ISS-08**.

---

## Checklist de cierre de Fase I

Antes de abrir **ISS-08**, confirma que **no existe ninguna pieza de Fase II** en el código. La Fase I se cierra cuando:

- [ ] Las **cinco pantallas de negocio** (`clientes`, `tipos-producto`, `productos`, `ventas`, `detalle-ventas`) hacen su CRUD contra `/api/*`.
- [ ] El **dashboard** agrega datos **sin llamadas duplicadas**.
- [ ] **No hay** `interceptor`, `guard`, `SessionStore` ni `*appHasPermission`.
- [ ] **No hay** `Authorization` en ninguna petición (Network).
- [ ] `npm test -- --watch=false` y `ng build` pasan.
- [ ] El **menú del Shell** tiene las entradas de negocio, **sin filtrar**.

### Checklist visual en `http://localhost:4200`

- [ ] `/dashboard` muestra KPIs y tablas.
- [ ] `/clientes` permite CRUD completo.
- [ ] `/tipos-producto` permite CRUD completo.
- [ ] `/productos` muestra tipo, precio y stock con semáforo.
- [ ] `/ventas` lista, abre el **detalle** y cancela.
- [ ] `/ventas/nueva` crea una venta con varias líneas.
- [ ] `/detalle-ventas` lista, edita líneas y ajusta el stock/totales.
- [ ] **Network**: 0 cabeceras `Authorization` en cualquier petición.

---

## Correspondencia con el código

Archivos que **crea o reemplaza** este ISS:

- `src/app/core/models/product-sale.model.ts` *(nuevo)*
- `src/app/core/utils/to-number.ts` *(nuevo)*
- `src/app/features/product-sales/product-sale-api.ts` *(nuevo)*
- `src/app/features/product-sales/product-sale-api.spec.ts` *(nuevo)*
- `src/app/features/product-sales/product-sale-form/product-sale-form.ts` *(reemplaza)*
- `src/app/features/product-sales/product-sale-form/product-sale-form.html` *(reemplaza)*
- `src/app/features/product-sales/product-sale-form/product-sale-form.css` *(reemplaza)*
- `src/app/features/product-sales/product-sale-form/product-sale-form.spec.ts` *(nuevo)*
- `src/app/features/product-sales/product-sale-list/product-sale-list.ts` *(reemplaza)*
- `src/app/features/product-sales/product-sale-list/product-sale-list.html` *(reemplaza)*
- `src/app/features/product-sales/product-sale-list/product-sale-list.css` *(reemplaza)*
- `src/app/features/product-sales/product-sale-list/product-sale-list.spec.ts` *(nuevo)*
- `src/app/features/sales/sale-detail/sale-detail.ts` *(nuevo)*
- `src/app/features/sales/sale-detail/sale-detail.html` *(nuevo)*
- `src/app/features/sales/sale-detail/sale-detail.css` *(nuevo)*
- `src/app/features/dashboard/dashboard.ts` *(reemplaza)*
- `src/app/features/dashboard/dashboard.html` *(reemplaza)*
- `src/app/features/dashboard/dashboard.css` *(reemplaza)*
- `src/app/features/dashboard/dashboard.spec.ts` *(nuevo)*
- `src/app/features/sales/sale-list/sale-list.ts` *(edita para `openDetail`, `detailVisible`, `selected`, `detailTitle`)*
- `src/app/features/sales/sale-list/sale-list.html` *(edita para añadir el botón "ver detalle" y el `p-dialog` con `<app-sale-detail>`)*
- `src/app/app.routes.ts` *(edita: añade `dashboard` y `detalle-ventas`, redirección `**` a `/dashboard`)*
- `src/app/layout/shell/shell.ts` *(edita: añade Panel y Detalle de ventas al menú)*

Archivos de **ISS-02 → ISS-06 que no se tocan**: `filter-rows.ts`, `api-error.ts`, `notification.ts`, `status-tag`, `page-header`, `empty-state`, `features/clients/`, `features/product-types/`, `features/products/`, `features/sales/sale-api.ts`, `features/sales/sale-form/`, `features/sales/sale-list/` **salvo** las dos ediciones puntuales indicadas arriba.

---

## Notas del docente

- **`SaleDetail` es presentacional**: no llama al backend. Recibe `sale` como `input.required<Sale>()` y `products` como `input<Product[]>([])`. La venta se carga en `SaleList` y se pasa al diálogo.
- **`/detalle-ventas` escribe sobre el stock**. Crear, editar, dar de baja o eliminar una línea **ajusta el stock** y **recalcula la cabecera**. Por eso el flujo normal de negocio es `POST /api/ventas`; `/detalle-ventas` es para **corregir**.
- **`toNumber` es obligatorio** en el dashboard: `revenue()` suma `total` que puede venir como `string`. Sin `toNumber`, concatenaría strings y mostraría un total absurdo.
- **`lowStock` respeta `min_stock`** en esta ISS, aunque el material del docente mencione un umbral fijo `5` en el dashboard consolidado. Es una **discrepancia pendiente de decisión**; se documenta aquí y se alineará en Fase II.
- **El permiso `GET api/product-types/`** que menciona el dashboard consolidado **no coincide** con `GET /api/tipos-producto` del catálogo Express. En Fase I no hay auth; en **ISS-09** se corregirá el permiso al path real.
- **`#header` / `#body`, no `pTemplate`** en PrimeNG 22. Con `pTemplate` la tabla **se pinta vacía sin error**.

---

## Navegación

⬅️ **Anterior:** ISS-06 — Ventas transaccionales y detalle
⬆️ **Ruta:** Frontend-Express · Fase I · Business · **cierre**
➡️ **Siguiente:** ISS-08 — Fase II · Sesión, JWT y refresh rotation