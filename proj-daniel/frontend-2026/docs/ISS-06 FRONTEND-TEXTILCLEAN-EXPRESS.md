# 🛠 ISS-06 · Ventas transaccionales y detalle

> **Proyecto frontend:** `front-textilclean-express` (carpeta real: `frontend-2026`)
> **Ruta frontend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026`
> **Proyecto backend:** `app-textilclean-express`
> **Ruta backend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express`
> **Fase:** I · Business · **Bloqueado por:** ISS-05 · **Habilita:** ISS-07
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
ls src/app/core/models/          # api.model.ts  client.model.ts  product-type.model.ts  product.model.ts
ls src/app/core/utils/           # api-error.ts  filter-rows.ts
ls src/app/features/clients/     # client-api.ts        client-form/        client-list/
ls src/app/features/product-types/   # product-type-api.ts  product-type-form/  product-type-list/
ls src/app/features/products/        # product-api.ts       product-form/       product-list/
ls src/app/shared/ui/                # page-header/  empty-state/  status-tag/
```

Si falta algo, **detente**: vuelve a ISS-02, 03, 04 o 05.

---

## Objetivo y encaje en la fase

Registrar una **venta completa en una sola petición**:

```json
POST /api/ventas
{
  "client_id": 1,
  "tax": 19,
  "discounts": 0,
  "items": [
    { "product_id": 3, "quantity": 2 },
    { "product_id": 7, "quantity": 1 }
  ]
}
```

El backend, dentro de una **transacción Sequelize**:

1. Valida cliente y productos activos.
2. Comprueba stock.
3. Calcula `unit_price`, `line_total`, `subtotal`, `tax`, `discounts`, `total`.
4. Inserta la cabecera en `sales` y las líneas en `product_sales`.
5. Descuenta stock de cada producto.
6. Hace **commit** o **rollback** si algo falla.

> **El frontend no envía precios ni totales.** Solo envía `client_id`, `tax`, `discounts` e `items`. Si enviaras precios, el backend los ignoraría o rechazaría.

> **Antes de construir:** borrador local primero — cliente, línea y total; `computed` para totales; valida stock; al final conecta una **única** creación transaccional.

**Evidencia de aprendizaje:** demuestra que **añadir una línea al borrador no cambia el stock del servidor** hasta confirmar la venta.

> **Alcance de fase.** Fase I (Business): sin login ni permisos. **ISS-09** añadirá el permiso de ruta `POST /api/ventas` y el botón de registrar venta.

**Equipo y terminal:** Ubuntu WSL, terminal del editor, carpeta `frontend-2026`.

---

## Criterios de aceptación (ISS-06)

- [ ] El formulario carga **clientes y productos activos**.
- [ ] No se pueden agregar líneas sin producto o con cantidad < 1.
- [ ] El stock se valida en el cliente y el backend vuelve a validar.
- [ ] Los totales se actualizan al agregar/quitar líneas y al cambiar impuesto/descuento.
- [ ] Al guardar, el backend devuelve la venta y la app navega a `/ventas`.
- [ ] El **stock de los productos disminuye** (verifícalo en `/productos`).
- [ ] Una venta con stock insuficiente **muestra error y no crea registros**.
- [ ] `ng serve` compila sin errores.

---

## 6.1 Modelo

```bash
cat > src/app/core/models/sale.model.ts <<'EOF'
import { Status } from './api.model';
import { Money, Timestamps } from './product.model';

/** Línea de venta tal como la devuelve el backend. */
export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: Money;
  line_total: Money;
  status: Status;
}

/** Venta (cabecera + líneas). */
export interface Sale extends Timestamps {
  id: number;
  client_id: number;
  subtotal: Money;
  tax: Money;
  discounts: Money;
  total: Money;
  status: Status;
  items?: SaleItem[];
}

/** Payload de alta: transaccional, sin precios ni totales. */
export interface SaleCreatePayload {
  client_id: number;
  tax: number;
  discounts: number;
  items: Array<{ product_id: number; quantity: number }>;
}

/** Payload de edición (ISS-07 lo usará para el detalle). */
export interface SaleUpdatePayload {
  client_id?: number;
  tax?: number;
  discounts?: number;
}
EOF
```

Si ya existía, **no lo sobrescribas** sin verificarlo con `cat`.

---

## 6.2 Generar los dos componentes

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
ng generate component features/sales/sale-list --skip-tests --defaults
ng generate component features/sales/sale-form --skip-tests --defaults
```

Comprueba la estructura:

```bash
ls -R src/app/features/sales/
```

Debe quedar así (los `.spec.ts` se sobrescriben más abajo):

```
src/app/features/sales/
├── sale-api.ts
├── sale-api.spec.ts
├── sale-form/
│   ├── sale-form.ts
│   ├── sale-form.html
│   ├── sale-form.css
│   └── sale-form.spec.ts
└── sale-list/
    ├── sale-list.ts
    ├── sale-list.html
    ├── sale-list.css
    └── sale-list.spec.ts
```

---

## 6.3 Servicio

```bash
cat > src/app/features/sales/sale-api.ts <<'EOF'
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Sale,
  SaleCreatePayload,
  SaleUpdatePayload,
} from '../../core/models/sale.model';

/** /api/ventas — POST es transaccional (cabecera + detalle + stock). */
@Injectable({ providedIn: 'root' })
export class SaleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ventas`;

  list(): Observable<Sale[]> {
    return this.http
      .get<{ sales: Sale[] }>(this.base)
      .pipe(map((response) => response.sales));
  }

  get(id: number): Observable<Sale> {
    return this.http
      .get<{ sale: Sale }>(`${this.base}/${id}`)
      .pipe(map((response) => response.sale));
  }

  /** POST transaccional: devuelve `{ sale, items }`; el stock ya está descontado. */
  create(payload: SaleCreatePayload): Observable<Sale> {
    return this.http
      .post<{ sale: Sale; items: unknown[] }>(this.base, payload)
      .pipe(map((response) => response.sale));
  }

  update(id: number, payload: SaleUpdatePayload): Observable<Sale> {
    return this.http
      .patch<{ sale: Sale }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.sale));
  }

  /** Cancelación: la venta y sus líneas pasan a inactive y el backend restaura el stock. */
  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  /** DELETE físico: borra primero product_sales y luego la cabecera. */
  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
EOF
```

### Prueba del servicio

```bash
cat > src/app/features/sales/sale-api.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { SaleApi } from './sale-api';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/ventas`;

describe('SaleApi', () => {
  let api: SaleApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(SaleApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps sales from list()', () => {
    let out: unknown;
    api.list().subscribe((r) => (out = r));
    http.expectOne(BASE).flush({ sales: [{ id: 1 }] });
    expect(out).toEqual([{ id: 1 }]);
  });

  it('POSTs a transactional creation without prices', () => {
    api
      .create({
        client_id: 1,
        tax: 19,
        discounts: 0,
        items: [{ product_id: 3, quantity: 2 }],
      })
      .subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      client_id: 1,
      tax: 19,
      discounts: 0,
      items: [{ product_id: 3, quantity: 2 }],
    });
    req.flush({ sale: { id: 10 }, items: [] });
  });

  it('PATCHes /deactivate', () => {
    api.deactivate(5).subscribe();
    const req = http.expectOne(`${BASE}/5/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('DELETEs physically', () => {
    api.remove(5).subscribe();
    const req = http.expectOne(`${BASE}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
EOF
```

---

## 6.4 Formulario de venta

El formulario **no usa `FormGroup`**: las líneas son un arreglo dinámico y los totales son derivados. Los signals son más directos aquí.

### 6.4.1 `sale-form.ts`

```bash
cat > src/app/features/sales/sale-form/sale-form.ts <<'EOF'
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { forkJoin } from 'rxjs';
import { Client } from '../../../core/models/client.model';
import { Product } from '../../../core/models/product.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ClientApi } from '../../clients/client-api';
import { ProductApi } from '../../products/product-api';
import { SaleApi } from '../sale-api';

interface DraftLine {
  product_id: number;
  quantity: number;
}

@Component({
  host: { class: 'block' },
  selector: 'app-sale-form',
  imports: [
    ButtonModule,
    CurrencyPipe,
    FormsModule,
    InputNumberModule,
    MessageModule,
    PageHeader,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './sale-form.html',
  styleUrl: './sale-form.css',
})
export class SaleForm {
  private readonly api = inject(SaleApi);
  private readonly clientsApi = inject(ClientApi);
  private readonly productsApi = inject(ProductApi);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  readonly clients = signal<Client[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly clientId = signal<number | null>(null);
  readonly tax = signal(0);
  readonly discounts = signal(0);

  readonly lines = signal<DraftLine[]>([]);
  readonly selectedProductId = signal<number | null>(null);
  readonly quantity = signal(1);

  readonly productById = computed(() => {
    const map = new Map(this.products().map((p) => [p.id, p]));
    return map;
  });

  /** Subtotal calculado desde el precio actual del producto. */
  readonly subtotal = computed(() =>
    this.lines().reduce((sum, line) => {
      const product = this.productById().get(line.product_id);
      return sum + Number(product?.price ?? 0) * line.quantity;
    }, 0),
  );

  readonly total = computed(
    () =>
      this.subtotal() + Number(this.tax() ?? 0) - Number(this.discounts() ?? 0),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      clients: this.clientsApi.list(),
      products: this.productsApi.list(),
    }).subscribe({
      next: ({ clients, products }) => {
        this.clients.set(clients);
        this.products.set(products);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  lineTotal(line: DraftLine): number {
    const product = this.productById().get(line.product_id);
    return Number(product?.price ?? 0) * line.quantity;
  }

  addLine(): void {
    const productId = this.selectedProductId();
    const requested = Number(this.quantity());
    this.error.set(null);

    if (productId === null) {
      this.error.set('Selecciona un producto.');
      return;
    }
    if (!Number.isFinite(requested) || requested < 1) {
      this.error.set('La cantidad debe ser al menos 1.');
      return;
    }

    const product = this.productById().get(productId);
    if (!product) {
      return;
    }

    const already = this.lines()
      .filter((line) => line.product_id === productId)
      .reduce((sum, line) => sum + line.quantity, 0);

    if (already + requested > product.quantity) {
      this.error.set(
        `Stock insuficiente de «${product.name}»: disponible ${product.quantity}, solicitado ${already + requested}.`,
      );
      return;
    }

    this.lines.update((lines) => {
      const found = lines.find((line) => line.product_id === productId);
      if (!found) {
        return [...lines, { product_id: productId, quantity: requested }];
      }
      return lines.map((line) =>
        line.product_id === productId
          ? { ...line, quantity: line.quantity + requested }
          : line,
      );
    });

    this.selectedProductId.set(null);
    this.quantity.set(1);
  }

  removeLine(index: number): void {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
  }

  save(): void {
    const clientId = this.clientId();
    if (clientId === null) {
      this.error.set('Selecciona un cliente activo.');
      return;
    }
    if (this.lines().length === 0) {
      this.error.set('La venta requiere al menos una línea.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.api
      .create({
        client_id: clientId,
        tax: Number(this.tax() ?? 0),
        discounts: Number(this.discounts() ?? 0),
        items: this.lines(),
      })
      .subscribe({
        next: (sale) => {
          this.saving.set(false);
          this.notify.success(
            `Venta #${sale.id} registrada`,
            'Stock y totales actualizados.',
          );
          void this.router.navigate(['/ventas']);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          const message = toApiMessage(error);
          this.error.set(message);
          this.notify.error('La venta no se registró', message);
        },
      });
  }
}
EOF
```

> **`Number(product?.price ?? 0)` es obligatorio** porque DECIMAL puede llegar como `string` (`"12.50"`). Si sumas strings, obtienes `"012.5015.00"`.
>
> **Por qué agrupar líneas del mismo producto**: el backend calcula una línea por `product_id`. Enviar dos líneas del mismo producto complica el descuento de stock y los totales. El frontend las suma antes de enviar.

### 6.4.2 `sale-form.html`

```bash
cat > src/app/features/sales/sale-form/sale-form.html <<'EOF'
<app-page-header
  title="Nueva venta"
  subtitle="El stock se descuenta al confirmar la venta, no al agregar líneas al borrador."
>
  <button pButton type="button" severity="secondary" outlined (click)="load()">
    <i pButtonIcon class="pi pi-refresh"></i>
    <span pButtonLabel>Recargar catálogos</span>
  </button>
</app-page-header>

@if (error()) {
  <p-message severity="error" styleClass="mb-4 w-full">
    {{ error() }}
  </p-message>
}

<p-card header="Cliente">
  <p-select
    [fluid]="true"
    [ngModel]="clientId()"
    (ngModelChange)="clientId.set($event)"
    [options]="clients()"
    optionLabel="name"
    optionValue="id"
    [filter]="true"
    placeholder="Selecciona un cliente activo"
    [loading]="loading()"
  />
</p-card>

<p-card header="Líneas" styleClass="mt-4">
  <div class="grid items-end gap-3 sm:grid-cols-[2fr_1fr_auto]">
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Producto</label>
      <p-select
        inputId="sale-product"
        [fluid]="true"
        [ngModel]="selectedProductId()"
        (ngModelChange)="selectedProductId.set($event)"
        [options]="products()"
        optionLabel="name"
        optionValue="id"
        [filter]="true"
        placeholder="Buscar producto"
      />
    </div>
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Cantidad</label>
      <p-inputnumber
        inputId="sale-qty"
        [fluid]="true"
        [ngModel]="quantity()"
        (ngModelChange)="quantity.set($event ?? 1)"
        [min]="1"
        [showButtons]="true"
      />
    </div>
    <button
      pButton
      type="button"
      (click)="addLine()"
      [disabled]="loading()"
    >
      <i pButtonIcon class="pi pi-plus"></i>
      <span pButtonLabel>Agregar</span>
    </button>
  </div>

  <div class="mt-4 overflow-hidden rounded-xl border border-slate-200">
    <p-table [value]="lines()" dataKey="product_id" tableStyleClass="min-w-3xl">
      <ng-template #header>
        <tr>
          <th>Producto</th>
          <th class="text-right">Precio</th>
          <th class="text-right">Cantidad</th>
          <th class="text-right">Total línea</th>
          <th class="w-12"></th>
        </tr>
      </ng-template>
      <ng-template #body let-line let-index="rowIndex">
        <tr>
          <td>
            {{ productById().get(line.product_id)?.name || ('Producto #' + line.product_id) }}
          </td>
          <td class="text-right">
            {{ productById().get(line.product_id)?.price | currency: 'USD' : 'symbol' : '1.2-2' }}
          </td>
          <td class="text-right">{{ line.quantity }}</td>
          <td class="text-right font-medium">
            {{ lineTotal(line) | currency: 'USD' : 'symbol' : '1.2-2' }}
          </td>
          <td class="text-right">
            <button
              pButton
              type="button"
              text
              rounded
              severity="danger"
              icon="pi pi-times"
              aria-label="Quitar línea"
              (click)="removeLine(index)"
            ></button>
          </td>
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr>
          <td colspan="5" class="p-4 text-center text-sm text-slate-500">
            Sin líneas todavía. Selecciona un producto y pulsa «Agregar».
          </td>
        </tr>
      </ng-template>
    </p-table>
  </div>
</p-card>

<p-card header="Totales" styleClass="mt-4">
  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Impuesto (valor absoluto)</label>
      <p-inputnumber
        [fluid]="true"
        [ngModel]="tax()"
        (ngModelChange)="tax.set($event ?? 0)"
        mode="decimal"
        [min]="0"
        [minFractionDigits]="2"
        [maxFractionDigits]="2"
      />
    </div>
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Descuento (valor absoluto)</label>
      <p-inputnumber
        [fluid]="true"
        [ngModel]="discounts()"
        (ngModelChange)="discounts.set($event ?? 0)"
        mode="decimal"
        [min]="0"
        [minFractionDigits]="2"
        [maxFractionDigits]="2"
      />
    </div>
  </div>

  <dl class="mt-4 space-y-2 text-sm">
    <div class="flex justify-between">
      <dt class="text-slate-500">Subtotal</dt>
      <dd class="font-medium">
        {{ subtotal() | currency: 'USD' : 'symbol' : '1.2-2' }}
      </dd>
    </div>
    <div class="flex justify-between">
      <dt class="text-slate-500">Impuesto</dt>
      <dd>{{ tax() | currency: 'USD' : 'symbol' : '1.2-2' }}</dd>
    </div>
    <div class="flex justify-between">
      <dt class="text-slate-500">Descuento</dt>
      <dd>-{{ discounts() | currency: 'USD' : 'symbol' : '1.2-2' }}</dd>
    </div>
    <div class="flex justify-between border-t border-slate-200 pt-2 text-base">
      <dt class="font-semibold">Total</dt>
      <dd class="font-semibold">
        {{ total() | currency: 'USD' : 'symbol' : '1.2-2' }}
      </dd>
    </div>
  </dl>

  <div class="mt-4 flex justify-end gap-2">
    <button
      pButton
      type="button"
      severity="secondary"
      outlined
      (click)="router.navigate(['/ventas'])"
    >
      <span pButtonLabel>Cancelar</span>
    </button>
    <button
      pButton
      type="button"
      [loading]="saving()"
      [disabled]="lines().length === 0"
      (click)="save()"
    >
      <i pButtonIcon class="pi pi-check"></i>
      <span pButtonLabel>Registrar venta</span>
    </button>
  </div>
</p-card>
EOF
```

> **`#header` / `#body`, no `pTemplate`.** PrimeNG 22 busca variables de plantilla; con `pTemplate` la tabla se pinta vacía sin error. Ver el PARCHE de ISS-03.

### 6.4.3 `sale-form.css` (vacío a propósito)

```bash
cat > src/app/features/sales/sale-form/sale-form.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 6.4.4 `sale-form.spec.ts`

```bash
cat > src/app/features/sales/sale-form/sale-form.spec.ts <<'EOF'
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { SaleForm } from './sale-form';
import { environment } from '../../../../environments/environment';

const CLIENTS_URL = `${environment.apiUrl}/clientes`;
const PRODUCTS_URL = `${environment.apiUrl}/productos`;
const SALES_URL = `${environment.apiUrl}/ventas`;

const CLIENTS = [
  { id: 1, name: 'Tienda Sur', status: 'active' as const },
];

const PRODUCTS = [
  { id: 1, name: 'Detergente', brand: 'M', price: 10, min_stock: 2, quantity: 5, product_type_id: 1, status: 'active' as const },
  { id: 2, name: 'Jabón', brand: 'M', price: 3, min_stock: 1, quantity: 2, product_type_id: 1, status: 'active' as const },
];

describe('SaleForm', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        providePrimeNG({ theme: { preset: Aura } }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function crear() {
    const fixture = TestBed.createComponent(SaleForm);
    fixture.detectChanges();
    http.expectOne(CLIENTS_URL).flush({ clients: CLIENTS });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
    await fixture.whenStable();
    return { fixture, form: fixture.componentInstance };
  }

  it('should reject addLine without product', async () => {
    const { form } = await crear();
    form.addLine();
    expect(form.error()).toContain('Selecciona un producto');
  });

  it('should reject quantity < 1', async () => {
    const { form } = await crear();
    form.selectedProductId.set(1);
    form.quantity.set(0);
    form.addLine();
    expect(form.error()).toContain('al menos 1');
  });

  it('should reject stock > available', async () => {
    const { form } = await crear();
    form.selectedProductId.set(2); // stock 2
    form.quantity.set(3);
    form.addLine();
    expect(form.error()).toContain('Stock insuficiente');
  });

  it('should merge lines of same product', async () => {
    const { form } = await crear();
    form.selectedProductId.set(1);
    form.quantity.set(1);
    form.addLine();
    form.selectedProductId.set(1);
    form.quantity.set(2);
    form.addLine();
    expect(form.lines()).toEqual([{ product_id: 1, quantity: 3 }]);
  });

  it('should recompute subtotal and total', async () => {
    const { form } = await crear();
    form.selectedProductId.set(1); // precio 10
    form.quantity.set(2);
    form.addLine();
    form.selectedProductId.set(2); // precio 3
    form.quantity.set(1);
    form.addLine();
    form.tax.set(5);
    form.discounts.set(2);

    expect(form.subtotal()).toBe(23);
    expect(form.total()).toBe(26);
  });

  it('should not call backend if client is missing', async () => {
    const { form } = await crear();
    form.selectedProductId.set(1);
    form.quantity.set(1);
    form.addLine();
    form.save();
    expect(form.error()).toContain('cliente');
    http.expectNone(SALES_URL);
  });

  it('should POST a transactional payload and navigate', async () => {
    const { form } = await crear();
    form.clientId.set(1);
    form.selectedProductId.set(1);
    form.quantity.set(2);
    form.addLine();
    form.tax.set(19);
    form.discounts.set(0);
    form.save();

    const post = http.expectOne(SALES_URL);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      client_id: 1,
      tax: 19,
      discounts: 0,
      items: [{ product_id: 1, quantity: 2 }],
    });
    post.flush({ sale: { id: 10 }, items: [] });
  });
});
EOF
```

---

## 6.5 Listado de ventas

`SaleList` combina ventas, clientes y productos con `forkJoin` para resolver nombres.

### 6.5.1 `sale-list.ts`

```bash
cat > src/app/features/sales/sale-list/sale-list.ts <<'EOF'
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { Client } from '../../../core/models/client.model';
import { Product } from '../../../core/models/product.model';
import { Sale } from '../../../core/models/sale.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { ClientApi } from '../../clients/client-api';
import { ProductApi } from '../../products/product-api';
import { SaleApi } from '../sale-api';

@Component({
  host: { class: 'block' },
  selector: 'app-sale-list',
  imports: [
    ButtonModule,
    CurrencyPipe,
    DatePipe,
    EmptyState,
    MessageModule,
    PageHeader,
    RouterLink,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './sale-list.html',
  styleUrl: './sale-list.css',
})
export class SaleList {
  private readonly api = inject(SaleApi);
  private readonly clientsApi = inject(ClientApi);
  private readonly productsApi = inject(ProductApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<Sale[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly clientName = computed(() => {
    const map = new Map(this.clients().map((c) => [c.id, c.name]));
    return (id: number) => map.get(id) ?? `Cliente #${id}`;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      sales: this.api.list(),
      clients: this.clientsApi.list(),
      products: this.productsApi.list(),
    }).subscribe({
      next: ({ sales, clients, products }) => {
        this.rows.set(sales);
        this.clients.set(clients);
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

  items(sale: Sale): number {
    return (sale.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
  }

  deactivate(sale: Sale): void {
    this.confirmation.confirm({
      header: 'Cancelar venta',
      message: `¿Cancelar la venta #${sale.id}? El stock de sus líneas activas se restaura.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Cancelar venta',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(sale.id).subscribe({
          next: () => {
            this.notify.warn(`Venta #${sale.id} cancelada`);
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo cancelar', toApiMessage(error));
          },
        });
      },
    });
  }

  remove(sale: Sale): void {
    this.confirmation.confirm({
      header: 'Eliminar venta',
      message: `Se borrará la venta #${sale.id} y sus líneas. El stock se restaura.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(sale.id).subscribe({
          next: () => {
            this.notify.success('Venta eliminada');
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

> **Frontera con Fase II.** El catálogo RBAC del backend **no incluye** `PATCH /api/ventas/:id/deactivate` ni `DELETE /api/ventas/:id`: solo concede `GET`, `GET /:id` y `POST`. En Fase I (backend sin middlewares) cancelar y eliminar funcionan y se prueban; en Fase II, **ISS-09** oculta esos dos botones y deja listar + registrar.

### 6.5.2 `sale-list.html`

```bash
cat > src/app/features/sales/sale-list/sale-list.html <<'EOF'
<app-page-header
  title="Ventas"
  subtitle="Cada venta es transaccional: cabecera, líneas y stock en una sola operación."
>
  <p-tag [value]="rows().length + ' registradas'" severity="info" [rounded]="true" />
  <button pButton type="button" routerLink="/ventas/nueva">
    <i pButtonIcon class="pi pi-plus"></i>
    <span pButtonLabel>Nueva venta</span>
  </button>
</app-page-header>

@if (error()) {
  <p-message severity="error" styleClass="mb-4 w-full">
    {{ error() }}
  </p-message>
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
        <th>Fecha</th>
        <th>Cliente</th>
        <th class="text-right">Líneas</th>
        <th class="text-right">Total</th>
        <th>Estado</th>
        <th class="w-40 text-right">Acciones</th>
      </tr>
    </ng-template>

    <ng-template #body let-sale>
      <tr>
        <td class="text-slate-500">#{{ sale.id }}</td>
        <td class="text-sm text-slate-600">
          {{ sale.created_at | date: 'short' }}
        </td>
        <td class="text-sm">{{ clientName()(sale.client_id) }}</td>
        <td class="text-right">{{ items(sale) }}</td>
        <td class="text-right font-medium">
          {{ sale.total | currency: 'USD' : 'symbol' : '1.2-2' }}
        </td>
        <td><app-status-tag [status]="sale.status" /></td>
        <td>
          <div class="flex justify-end gap-1">
            <button
              pButton type="button" text rounded severity="warn"
              icon="pi pi-ban" aria-label="Cancelar venta"
              pTooltip="Cancelar (restaura stock)" (click)="deactivate(sale)"
            ></button>
            <button
              pButton type="button" text rounded severity="danger"
              icon="pi pi-trash" aria-label="Eliminar venta"
              pTooltip="Eliminar (restaura stock)" (click)="remove(sale)"
            ></button>
          </div>
        </td>
      </tr>
    </ng-template>

    <ng-template #emptymessage>
      <tr>
        <td colspan="7">
          <app-empty-state
            icon="pi pi-shopping-cart"
            title="Sin ventas registradas"
            message="Crea la primera con «Nueva venta»."
          />
        </td>
      </tr>
    </ng-template>
  </p-table>
</div>
EOF
```

### 6.5.3 `sale-list.css` (vacío a propósito)

```bash
cat > src/app/features/sales/sale-list/sale-list.css <<'EOF'
/* Vacío a propósito: el aspecto viene de Tailwind y del tema Aura. */
EOF
```

### 6.5.4 `sale-list.spec.ts`

```bash
cat > src/app/features/sales/sale-list/sale-list.spec.ts <<'EOF'
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
import { SaleList } from './sale-list';
import { environment } from '../../../../environments/environment';

const CLIENTS_URL = `${environment.apiUrl}/clientes`;
const PRODUCTS_URL = `${environment.apiUrl}/productos`;
const SALES_URL = `${environment.apiUrl}/ventas`;

const CLIENTS = [{ id: 1, name: 'Tienda Sur', status: 'active' as const }];
const PRODUCTS = [{ id: 1, name: 'Detergente', price: 10, status: 'active' as const }];
const SALES = [
  {
    id: 10,
    client_id: 1,
    subtotal: 20,
    tax: 4,
    discounts: 0,
    total: 24,
    status: 'active' as const,
    created_at: '2026-01-01T00:00:00Z',
    items: [{ id: 1, sale_id: 10, product_id: 1, quantity: 2, unit_price: 10, line_total: 20, status: 'active' as const }],
  },
];

describe('SaleList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleList],
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
    const fixture = TestBed.createComponent(SaleList);
    fixture.detectChanges();
    http.expectOne(SALES_URL).flush({ sales: SALES });
    http.expectOne(CLIENTS_URL).flush({ clients: CLIENTS });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
    await fixture.whenStable();
    return { fixture, lista: fixture.componentInstance };
  }

  it('should resolve client name and count items', async () => {
    const { lista } = await crearLista();
    expect(lista.clientName()(1)).toBe('Tienda Sur');
    expect(lista.items(SALES[0])).toBe(2);
  });

  it('should call deactivate after confirmation', async () => {
    const { lista } = await crearLista();
    const confirmacion = TestBed.inject(ConfirmationService);
    spyOn(confirmacion, 'confirm').and.callFake((opts: any) => {
      opts.accept?.();
      return confirmacion;
    });
    lista.deactivate(SALES[0]);
    const baja = http.expectOne(`${SALES_URL}/10/deactivate`);
    expect(baja.request.method).toBe('PATCH');
    baja.flush({});
    http.expectOne(SALES_URL).flush({ sales: [] });
    http.expectOne(CLIENTS_URL).flush({ clients: CLIENTS });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
  });

  it('should call DELETE for physical removal', async () => {
    const { lista } = await crearLista();
    const confirmacion = TestBed.inject(ConfirmationService);
    spyOn(confirmacion, 'confirm').and.callFake((opts: any) => {
      opts.accept?.();
      return confirmacion;
    });
    lista.remove(SALES[0]);
    const del = http.expectOne(`${SALES_URL}/10`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
    http.expectOne(SALES_URL).flush({ sales: [] });
    http.expectOne(CLIENTS_URL).flush({ clients: CLIENTS });
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
  });
});
EOF
```

---

## 6.6 Rutas y menú

### 6.6.1 Editar `src/app/app.routes.ts`

Añade las dos rutas **debajo** de `productos`:

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

> Si `features/construir/` aún no existe, **quita ese bloque ahora**.

### 6.6.2 Editar `src/app/layout/shell/shell.ts`

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
    { label: 'Ventas', icon: 'pi pi-shopping-cart', routerLink: '/ventas' },
    { label: 'Prototipo', icon: 'pi pi-desktop', routerLink: '/construir' },
  ];

  protected onMenuToggle(): void {
    this.mobileOpen.update((v) => !v);
  }
}
EOF
```

> **Ajuste en `shell.html`**: si aún no tenías `[items]="items"` en `<app-aside>` y `routerLink` en el `Aside`, añádelos. En el proyecto consolidado el menú se llama `NAV` y se filtra por permisos; en el recorrido de práctica empieza con `items` estático.

---

## Verificación del ISS

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026

# 1. El servicio usa /ventas y POST transaccional
grep -n "ventas" src/app/features/sales/sale-api.ts
grep -n "create(payload: SaleCreatePayload)" src/app/features/sales/sale-api.ts

# 2. El modelo de venta no incluye precios en el payload
grep -n "SaleCreatePayload" src/app/core/models/sale.model.ts
grep -n "price" src/app/core/models/sale.model.ts | grep -i "create" || echo "sin price en create: correcto"

# 3. El formulario usa signals, computed y no envía precios
grep -n "subtotal = computed\|total = computed" \
  src/app/features/sales/sale-form/sale-form.ts
grep -n "price" src/app/features/sales/sale-form/sale-form.ts | grep -i "emit" || echo "sin price en emit: correcto"

# 4. Plantillas PrimeNG 22 (sin pTemplate)
grep -n "#header\|#body\|#emptymessage" \
  src/app/features/sales/sale-form/sale-form.html \
  src/app/features/sales/sale-list/sale-list.html
grep -rn "pTemplate=" src/app/features/sales/ || echo "sin pTemplate: correcto"

# 5. Rutas y menú
grep -n "ventas" src/app/app.routes.ts src/app/layout/shell/shell.ts

# 6. CSS vacíos
for f in src/app/features/sales/**/*.css; do
  grep -q '[{}]' "$f" && echo "REGLAS EN $f"
done

# 7. Pruebas y build
npm test -- --watch=false
ng build
```

### Comprobación transaccional (contra el backend)

```bash
# Stock antes
curl -s http://localhost:4000/api/productos | head -c 500

# Crear venta
curl -s -X POST http://localhost:4000/api/ventas \
  -H "Content-Type: application/json" \
  -d '{"client_id":1,"tax":0,"discounts":0,"items":[{"product_id":1,"quantity":1}]}'

# Stock después: debe haber bajado 1
curl -s http://localhost:4000/api/productos | head -c 500
```

> **Si el backend responde `401`, está en modo Fase II.** No añadas el header `Authorization` a mano en esta ISS: la Fase I se prueba contra una copia del backend anterior a su ISS-13, un stub, o con `AUTH_ENABLED=false`. El token y el interceptor son **ISS-08**.

### Prueba funcional en la UI

Abre `http://localhost:4200` y verifica:

| Comprobación | Resultado esperado |
|---|---|
| `/ventas/nueva` por URL directa | Monta el `Shell` y el formulario |
| Cargar | Los `p-select` de cliente y producto se llenan |
| Agregar sin producto | Muestra «Selecciona un producto» y no agrega |
| Cantidad < 1 | Muestra «La cantidad debe ser al menos 1» |
| Stock insuficiente | Muestra «Stock insuficiente de «X»: disponible N, solicitado M» |
| Agregar el mismo producto dos veces | Se **agrupa** en una sola línea (cantidades sumadas) |
| Cambiar impuesto/descuento | Subtotal no cambia; Total se recalcula al instante |
| Guardar sin cliente | Muestra «Selecciona un cliente activo» y **no** llama al backend |
| Guardar con todo correcto | `POST /api/ventas` con `{ client_id, tax, discounts, items }`; navega a `/ventas` |
| Stock en `/productos` | **Bajó** exactamente la cantidad vendida |
| `curl /api/ventas` | Devuelve la venta recién creada |
| Cancelar una venta | `PATCH /api/ventas/:id/deactivate`; el stock de sus líneas **se restaura** |
| Eliminar una venta | `DELETE /api/ventas/:id`; el stock **se restaura** |

---

## Correspondencia con el código

Archivos que **crea o reemplaza** este ISS:

- `src/app/core/models/sale.model.ts` *(si no existía)*
- `src/app/features/sales/sale-api.ts` *(nuevo)*
- `src/app/features/sales/sale-api.spec.ts` *(nuevo)*
- `src/app/features/sales/sale-form/sale-form.ts` *(reemplaza)*
- `src/app/features/sales/sale-form/sale-form.html` *(reemplaza)*
- `src/app/features/sales/sale-form/sale-form.css` *(reemplaza)*
- `src/app/features/sales/sale-form/sale-form.spec.ts` *(nuevo)*
- `src/app/features/sales/sale-list/sale-list.ts` *(reemplaza)*
- `src/app/features/sales/sale-list/sale-list.html` *(reemplaza)*
- `src/app/features/sales/sale-list/sale-list.css` *(reemplaza)*
- `src/app/features/sales/sale-list/sale-list.spec.ts` *(nuevo)*
- `src/app/app.routes.ts` *(edita)*
- `src/app/layout/shell/shell.ts` *(edita)*
- `src/app/layout/shell/shell.html` *(si aún no tenía `[items]` y `routerLink`)*

Archivos de **ISS-02 a ISS-05 que no se tocan**: `filter-rows.ts`, `api-error.ts`, `notification.ts`, `status-tag`, `page-header`, `empty-state`, `features/clients/`, `features/product-types/`, `features/products/`.

---

## Notas del docente

- **El frontend no envía precios ni totales.** Solo `client_id`, `tax`, `discounts` e `items`. El backend calcula `unit_price`, `line_total`, `subtotal`, `tax`, `discounts` y `total` **dentro de la transacción**.
- **Borrador local primero.** Añadir una línea **no cambia el stock del servidor**. Solo `POST /api/ventas` descuenta stock, y dentro de una transacción Sequelize con rollback si algo falla.
- **Agrupar líneas del mismo producto** antes de enviar. El backend espera una línea por `product_id`.
- **`Number(product?.price ?? 0)`** porque DECIMAL puede llegar como `string`. Sin `Number`, sumar strings produce `"012.5015.00"`.
- **Validación preventiva en el cliente**: da feedback inmediato, pero **el backend vuelve a validar** con la transacción. Si el stock cambió entre la carga y el `POST`, el backend responde error y la venta **no se crea**.
- **Frontera con Fase II.** El catálogo RBAC **no incluye** `PATCH /api/ventas/:id/deactivate` ni `DELETE /api/ventas/:id`: solo concede `GET`, `GET /:id` y `POST`. En **ISS-09** se ocultan los botones de cancelar/eliminar y se dejan solo listar + registrar.
- **`#header` / `#body`, no `pTemplate`.** PrimeNG 22 busca variables de plantilla; con `pTemplate` la tabla **se pinta vacía sin error**.

---

## Navegación

⬅️ **Anterior:** ISS-05 — CRUD de productos y relación con tipos
⬆️ **Ruta:** Frontend-Express · Fase I · Business
➡️ **Siguiente:** ISS-07 — Detalle de ventas, dashboard y cierre de Fase I