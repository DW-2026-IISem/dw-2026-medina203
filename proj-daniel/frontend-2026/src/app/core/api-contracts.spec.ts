import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { CustomerApi } from '../features/customers/customer-api';
import { GarmentTypeApi } from '../features/garment-types/garment-type-api';
import { LaundryServiceApi } from '../features/laundry-services/laundry-service-api';
import { ServiceOrderApi } from '../features/service-orders/service-order-api';
import { ServiceOrderItemApi } from '../features/service-order-items/service-order-item-api';
import { UserApi } from '../features/admin/users/user-api';
import { RoleApi } from '../features/admin/roles/role-api';
import { ResourceApi } from '../features/admin/resources/resource-api';
import { RoleUserApi } from '../features/admin/role-users/role-user-api';
import { ResourceRoleApi } from '../features/admin/resource-roles/resource-role-api';

const API = environment.apiUrl;

/**
 * Contrato HTTP de los servicios de API contra app-textilclean-express:
 * URL, método y envoltura de la respuesta (`{ customers }`, `{ customer }`…).
 */
describe('Contratos de API (ISS-02)', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('apiUrl apunta al backend en :4000 y no termina en slash', () => {
    expect(API).toBe('http://localhost:4000/api');
  });

  const listCases: Array<
    [string, () => { list: () => import('rxjs').Observable<unknown[]> }, string, string]
  > = [
    ['CustomerApi', () => TestBed.inject(CustomerApi), '/clientes', 'customers'],
    ['GarmentTypeApi', () => TestBed.inject(GarmentTypeApi), '/tipos-prenda', 'garment_types'],
    [
      'LaundryServiceApi',
      () => TestBed.inject(LaundryServiceApi),
      '/servicios',
      'laundry_services',
    ],
    ['ServiceOrderApi', () => TestBed.inject(ServiceOrderApi), '/ordenes', 'service_orders'],
    [
      'ServiceOrderItemApi',
      () => TestBed.inject(ServiceOrderItemApi),
      '/detalle-ordenes',
      'service_order_items',
    ],
    ['UserApi', () => TestBed.inject(UserApi), '/usuarios', 'users'],
    ['RoleApi', () => TestBed.inject(RoleApi), '/roles', 'roles'],
    ['ResourceApi', () => TestBed.inject(ResourceApi), '/recursos', 'resources'],
    ['RoleUserApi', () => TestBed.inject(RoleUserApi), '/asignaciones-rol', 'assignments'],
    ['ResourceRoleApi', () => TestBed.inject(ResourceRoleApi), '/concesiones-rol', 'grants'],
  ];

  for (const [name, factory, path, key] of listCases) {
    it(`${name}.list() hace GET ${path} y desenvuelve { ${key} }`, () => {
      let result: unknown[] | undefined;
      factory()
        .list()
        .subscribe((rows) => (result = rows));
      const req = http.expectOne(`${API}${path}`);
      expect(req.request.method).toBe('GET');
      req.flush({ [key]: [{ id: 1 }] });
      expect(result).toEqual([{ id: 1 }]);
    });
  }

  it('CustomerApi usa PATCH, PUT, /deactivate y DELETE', () => {
    const api = TestBed.inject(CustomerApi);
    api.update(3, { phone: '300' }).subscribe();
    api
      .replace(3, { business_name: 'Hotel', tax_id: '900123456-7', phone: '3', email: 'a@b.co' })
      .subscribe();
    api.deactivate(3).subscribe();
    api.remove(3).subscribe();

    expect(http.expectOne({ method: 'PATCH', url: `${API}/clientes/3` }).request.body).toEqual({
      phone: '300',
    });
    http.expectOne({ method: 'PUT', url: `${API}/clientes/3` }).flush({ customer: {} });
    http.expectOne({ method: 'PATCH', url: `${API}/clientes/3/deactivate` }).flush({});
    http.expectOne({ method: 'DELETE', url: `${API}/clientes/3` }).flush({});
  });

  it('ServiceOrderApi filtra por estado y cliente', () => {
    TestBed.inject(ServiceOrderApi).list({ process_status: 'ready', customer_id: 2 }).subscribe();
    const req = http.expectOne((r) => r.url === `${API}/ordenes`);
    expect(req.request.params.get('process_status')).toBe('ready');
    expect(req.request.params.get('customer_id')).toBe('2');
    req.flush({ service_orders: [] });
  });

  it('ServiceOrderApi.changeStatus hace PATCH /ordenes/:id/estado', () => {
    TestBed.inject(ServiceOrderApi).changeStatus(7, 'in_process').subscribe();
    const req = http.expectOne(`${API}/ordenes/7/estado`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ process_status: 'in_process' });
    req.flush({ service_order: { id: 7 } });
  });

  it('ServiceOrderItemApi filtra por orden', () => {
    TestBed.inject(ServiceOrderItemApi).list(5).subscribe();
    const req = http.expectOne((r) => r.url === `${API}/detalle-ordenes`);
    expect(req.request.params.get('service_order_id')).toBe('5');
    req.flush({ service_order_items: [] });
  });

  it('UserApi.permissions consulta /usuarios/:id/permisos', () => {
    TestBed.inject(UserApi).permissions(2).subscribe();
    http.expectOne(`${API}/usuarios/2/permisos`).flush({ permissions: [] });
  });
});
