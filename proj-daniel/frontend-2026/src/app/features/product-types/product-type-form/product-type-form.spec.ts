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
