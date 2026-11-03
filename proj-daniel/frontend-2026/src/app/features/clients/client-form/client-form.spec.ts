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
