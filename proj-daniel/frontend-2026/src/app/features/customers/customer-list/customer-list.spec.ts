import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { Customer } from '../../../core/models/customer.model';
import { CustomerList } from './customer-list';

const URL = `${environment.apiUrl}/clientes`;
const ROWS: Customer[] = [
  {
    id: 1,
    business_name: 'Hotel Waya',
    tax_id: '900123456-7',
    contact_name: 'Laura',
    phone: '300',
    email: 'a@waya.com',
    address: null,
    status: 'active',
  },
  {
    id: 2,
    business_name: 'Clínica Norte',
    tax_id: '800111222-3',
    contact_name: null,
    phone: '301',
    email: 'b@norte.com',
    address: 'Calle 2',
    status: 'active',
  },
];

describe('CustomerList', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CustomerList],
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

  it('carga los clientes al iniciar', () => {
    const list = TestBed.createComponent(CustomerList).componentInstance;
    expect(list.loading()).toBe(true);
    http.expectOne(URL).flush({ customers: ROWS });
    expect(list.rows()).toHaveLength(2);
    expect(list.loading()).toBe(false);
  });

  it('filtra por NIT y por razón social', () => {
    const list = TestBed.createComponent(CustomerList).componentInstance;
    http.expectOne(URL).flush({ customers: ROWS });
    list.filter.set('800111');
    expect(list.visibleRows().map((c) => c.id)).toEqual([2]);
    list.filter.set('waya');
    expect(list.visibleRows().map((c) => c.id)).toEqual([1]);
  });

  it('muestra el error del backend si la carga falla', () => {
    const list = TestBed.createComponent(CustomerList).componentInstance;
    http
      .expectOne(URL)
      .flush({ error: 'Missing Bearer token' }, { status: 401, statusText: 'Unauthorized' });
    expect(list.error()).toBe('Missing Bearer token');
    expect(list.rows()).toEqual([]);
  });

  it('crea con POST y edita con PATCH', () => {
    const list = TestBed.createComponent(CustomerList).componentInstance;
    http.expectOne(URL).flush({ customers: ROWS });

    list.openCreate();
    list.save({ business_name: 'Spa', tax_id: '9001', phone: '3', email: 's@spa.co' });
    expect(http.expectOne({ method: 'POST', url: URL }).request.body.business_name).toBe('Spa');

    list.openEdit(ROWS[0]);
    list.save({
      business_name: 'Hotel Waya S.A.S.',
      tax_id: '900123456-7',
      phone: '300',
      email: 'a@waya.com',
    });
    http.expectOne({ method: 'PATCH', url: `${URL}/1` });
  });
});
