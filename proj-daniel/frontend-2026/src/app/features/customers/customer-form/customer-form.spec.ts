import { TestBed } from '@angular/core/testing';
import { Customer, CustomerCreatePayload } from '../../../core/models/customer.model';
import { CustomerForm } from './customer-form';

const HOTEL: Customer = {
  id: 4,
  business_name: 'Hotel Waya',
  tax_id: '900123456-7',
  contact_name: 'Laura',
  phone: '3001234567',
  email: 'compras@waya.com',
  address: null,
  status: 'active',
};

function setup(customer: Customer | null = null) {
  TestBed.configureTestingModule({ imports: [CustomerForm] });
  const fixture = TestBed.createComponent(CustomerForm);
  fixture.componentRef.setInput('customer', customer);
  fixture.detectChanges();
  const emitted: CustomerCreatePayload[] = [];
  fixture.componentInstance.saved.subscribe((p) => emitted.push(p));
  return { form: fixture.componentInstance, emitted };
}

describe('CustomerForm', () => {
  it('no emite si faltan campos obligatorios', () => {
    const { form, emitted } = setup();
    form.submit();
    expect(emitted).toHaveLength(0);
    expect(form.form.controls.business_name.touched).toBe(true);
  });

  it('rechaza un NIT con letras', () => {
    const { form } = setup();
    form.form.controls.tax_id.setValue('ABC123');
    expect(form.form.controls.tax_id.hasError('pattern')).toBe(true);
    form.form.controls.tax_id.setValue('900123456-7');
    expect(form.form.controls.tax_id.valid).toBe(true);
  });

  it('en creación emite el payload limpio con status', () => {
    const { form, emitted } = setup();
    form.form.setValue({
      business_name: '  Clínica Riohacha ',
      tax_id: '800555111-2',
      contact_name: '',
      phone: '3005550000',
      email: 'Compras@Clinica.co',
      address: '',
      status: 'active',
    });
    form.submit();
    expect(emitted[0]).toEqual({
      business_name: 'Clínica Riohacha',
      tax_id: '800555111-2',
      contact_name: null,
      phone: '3005550000',
      email: 'compras@clinica.co',
      address: null,
      status: 'active',
    });
  });

  it('en edición carga el cliente, bloquea el estado y no envía status', () => {
    const { form, emitted } = setup(HOTEL);
    expect(form.form.controls.business_name.value).toBe('Hotel Waya');
    expect(form.form.controls.status.disabled).toBe(true);
    form.submit();
    expect(emitted[0]).not.toHaveProperty('status');
  });
});
