import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Client } from '../../core/models/client.model';
import { ClientApi } from './client-api';

const BASE = `${environment.apiUrl}/clientes`;

const CLIENTE: Client = {
  id: 1,
  name: 'Textiles del Norte',
  address: 'Calle 10 # 20-30',
  phone: '3001234567',
  email: 'compras@textilesnorte.co',
  status: 'active',
};

describe('ClientApi', () => {
  let api: ClientApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ClientApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should unwrap { clients } into Client[]', () => {
    let resultado: Client[] | undefined;
    api.list().subscribe((clients) => (resultado = clients));

    const peticion = http.expectOne(BASE);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({ clients: [CLIENTE] });

    expect(resultado).toEqual([CLIENTE]);
  });

  it('should build URLs from environment.apiUrl (no trailing slash)', () => {
    expect(environment.apiUrl.endsWith('/api')).toBe(true);
    api.list().subscribe();
    http.expectOne('http://localhost:3000/api/clientes').flush({ clients: [] });
  });
});
