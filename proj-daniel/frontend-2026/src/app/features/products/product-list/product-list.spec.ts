import { TestBed } from '@angular/core/testing';
import { SessionStore } from '../../../core/services/session-store';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
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
  {
    id: 1,
    name: 'Detergente',
    brand: 'Marca',
    price: 10,
    min_stock: 2,
    quantity: 5,
    product_type_id: 1,
    status: 'active' as const,
  },
  {
    id: 2,
    name: 'Helado',
    brand: 'Frío',
    price: 5,
    min_stock: 3,
    quantity: 0,
    product_type_id: 2,
    status: 'active' as const,
  },
  {
    id: 3,
    name: 'Jabón',
    brand: 'Marca',
    price: 3,
    min_stock: 4,
    quantity: 4,
    product_type_id: 1,
    status: 'active' as const,
  },
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
    // Las listas solo piden catálogos auxiliares que el rol puede leer.
    localStorage.clear();
    TestBed.inject(SessionStore).setAccess({
      user: null as never,
      permissions: [
        {
          resource_id: 1,
          method: 'GET' as const,
          path: '/api/productos',
          description: null,
          role_id: 1,
          role_name: 'ADMIN',
        },
        {
          resource_id: 2,
          method: 'GET' as const,
          path: '/api/tipos-producto',
          description: null,
          role_id: 1,
          role_name: 'ADMIN',
        },
      ],
    });
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

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
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(PRODUCTS.length);
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
    const tipos = http.expectOne(TYPES_URL);
    const productos = http.expectOne(PRODUCTS_URL);
    tipos.flush({ error: 'x' }, { status: 500, statusText: 'Error' });
    // forkJoin cancela la otra petición en cuanto una falla.
    expect(productos.cancelled).toBe(true);
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
    vi.spyOn(confirmacion, 'confirm').mockImplementation((opts: any) => {
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
    vi.spyOn(confirmacion, 'confirm').mockImplementation((opts: any) => {
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
    vi.spyOn(mensajes, 'add');
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

  it('should list products without asking for types when the role cannot read them', async () => {
    TestBed.inject(SessionStore).setAccess({
      user: null as never,
      permissions: [
        {
          resource_id: 1,
          method: 'GET',
          path: '/api/productos',
          description: null,
          role_id: 2,
          role_name: 'SELLER',
        },
      ],
    });
    const fixture = TestBed.createComponent(ProductList);
    fixture.detectChanges();
    http.expectOne(PRODUCTS_URL).flush({ products: PRODUCTS });
    http.expectNone(TYPES_URL);
    await fixture.whenStable();

    const lista = fixture.componentInstance;
    expect(lista.error()).toBeNull();
    expect(lista.rows().length).toBe(PRODUCTS.length);
    expect(lista.typeName()(PRODUCTS[0].product_type_id)).toBe(
      `Tipo #${PRODUCTS[0].product_type_id}`,
    );
  });
});
