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
