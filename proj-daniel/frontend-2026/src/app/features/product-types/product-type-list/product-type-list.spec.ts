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
    vi.spyOn(confirmacion, 'confirm').mockImplementation((opts: any) => {
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
    vi.spyOn(confirmacion, 'confirm').mockImplementation((opts: any) => {
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
    vi.spyOn(mensajes, 'add');
    lista.openCreate();
    lista.save({ name: 'X', description: null });
    http
      .expectOne(BASE)
      .flush({ error: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    expect(mensajes.add).toHaveBeenCalled();
  });
});
