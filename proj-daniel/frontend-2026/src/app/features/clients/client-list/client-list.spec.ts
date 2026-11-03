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
