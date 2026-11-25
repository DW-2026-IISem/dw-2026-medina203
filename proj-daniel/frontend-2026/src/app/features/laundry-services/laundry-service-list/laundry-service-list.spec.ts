import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { LaundryService } from '../../../core/models/laundry-service.model';
import { LaundryServiceForm } from '../laundry-service-form/laundry-service-form';
import { LaundryServiceList } from './laundry-service-list';

const API = environment.apiUrl;
const SERVICES: LaundryService[] = [
  {
    id: 1,
    name: 'Lavado y secado - Sábanas',
    description: null,
    price: '5500.00',
    billing_unit: 'kg',
    estimated_hours: 24,
    garment_type_id: 1,
    status: 'active',
    garment_type: { id: 1, name: 'Sábanas' },
  },
  {
    id: 2,
    name: 'Planchado - Uniformes',
    description: null,
    price: '2500.00',
    billing_unit: 'unit',
    estimated_hours: 12,
    garment_type_id: 7,
    status: 'active',
    garment_type: { id: 7, name: 'Uniformes' },
  },
];

describe('LaundryServiceList y LaundryServiceForm', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LaundryServiceList, LaundryServiceForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        ConfirmationService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadList() {
    const list = TestBed.createComponent(LaundryServiceList).componentInstance;
    http.expectOne(`${API}/servicios`).flush({ laundry_services: SERVICES });
    http.expectOne(`${API}/tipos-prenda`).flush({
      garment_types: [
        { id: 1, name: 'Sábanas', description: null, status: 'active' },
        { id: 7, name: 'Uniformes', description: null, status: 'active' },
      ],
    });
    return list;
  }

  it('carga servicios y tipos de prenda en paralelo', () => {
    const list = loadList();
    expect(list.rows()).toHaveLength(2);
    expect(list.garmentTypes()).toHaveLength(2);
    expect(list.loading()).toBe(false);
  });

  it('filtra por tipo de prenda y por texto', () => {
    const list = loadList();
    list.garmentTypeFilter.set(7);
    expect(list.visibleRows().map((s) => s.id)).toEqual([2]);
    list.garmentTypeFilter.set(null);
    list.filter.set('sábanas');
    expect(list.visibleRows().map((s) => s.id)).toEqual([1]);
  });

  it('el formulario envía garment_type_id numérico y precio como número', () => {
    const fixture = TestBed.createComponent(LaundryServiceForm);
    fixture.componentRef.setInput('service', SERVICES[0]);
    fixture.detectChanges();
    const form = fixture.componentInstance;
    expect(form.form.controls.price.value).toBe(5500);

    const emitted: unknown[] = [];
    form.saved.subscribe((p) => emitted.push(p));
    form.form.controls.price.setValue(6000);
    form.submit();
    expect(emitted[0]).toMatchObject({ garment_type_id: 1, price: 6000, billing_unit: 'kg' });
  });

  it('el formulario exige tipo de prenda y precio', () => {
    const fixture = TestBed.createComponent(LaundryServiceForm);
    fixture.detectChanges();
    const form = fixture.componentInstance;
    form.form.controls.name.setValue('Desmanchado - Manteles');
    form.submit();
    expect(form.form.controls.garment_type_id.invalid).toBe(true);
    expect(form.form.controls.price.invalid).toBe(true);
  });
});
