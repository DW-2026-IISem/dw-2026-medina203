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
