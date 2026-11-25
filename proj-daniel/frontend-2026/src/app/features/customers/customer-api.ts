import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Customer,
  CustomerCreatePayload,
  CustomerUpdatePayload,
} from '../../core/models/customer.model';

/** Contrato de `/clientes` en app-textilclean-express. */
@Injectable({ providedIn: 'root' })
export class CustomerApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/clientes`;

  list(): Observable<Customer[]> {
    return this.http.get<{ customers: Customer[] }>(this.base).pipe(map((r) => r.customers));
  }

  get(id: number): Observable<Customer> {
    return this.http.get<{ customer: Customer }>(`${this.base}/${id}`).pipe(map((r) => r.customer));
  }

  create(payload: CustomerCreatePayload): Observable<Customer> {
    return this.http.post<{ customer: Customer }>(this.base, payload).pipe(map((r) => r.customer));
  }

  /** PATCH: actualización parcial (la que usan los formularios). */
  update(id: number, payload: Partial<CustomerUpdatePayload>): Observable<Customer> {
    return this.http
      .patch<{ customer: Customer }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.customer));
  }

  /** PUT: reemplazo completo. */
  replace(id: number, payload: CustomerUpdatePayload): Observable<Customer> {
    return this.http
      .put<{ customer: Customer }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.customer));
  }

  /** Borrado lógico: status = inactive. */
  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  /** Borrado físico. */
  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
