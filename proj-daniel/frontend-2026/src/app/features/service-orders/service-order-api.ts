import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProcessStatus,
  ServiceOrder,
  ServiceOrderCreatePayload,
  ServiceOrderFilters,
  ServiceOrderUpdatePayload,
} from '../../core/models/service-order.model';

/**
 * Contrato de `/ordenes` en app-textilclean-express.
 * `POST` es transaccional: crea la orden con sus líneas y calcula los totales.
 */
@Injectable({ providedIn: 'root' })
export class ServiceOrderApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ordenes`;

  list(filters: ServiceOrderFilters = {}): Observable<ServiceOrder[]> {
    let params = new HttpParams();
    if (filters.customer_id) params = params.set('customer_id', filters.customer_id);
    if (filters.process_status) params = params.set('process_status', filters.process_status);
    return this.http
      .get<{ service_orders: ServiceOrder[] }>(this.base, { params })
      .pipe(map((r) => r.service_orders));
  }

  /** Incluye el cliente y las líneas activas con su servicio. */
  get(id: number): Observable<ServiceOrder> {
    return this.http
      .get<{ service_order: ServiceOrder }>(`${this.base}/${id}`)
      .pipe(map((r) => r.service_order));
  }

  create(payload: ServiceOrderCreatePayload): Observable<ServiceOrder> {
    return this.http
      .post<{ service_order: ServiceOrder }>(this.base, payload)
      .pipe(map((r) => r.service_order));
  }

  update(id: number, payload: ServiceOrderUpdatePayload): Observable<ServiceOrder> {
    return this.http
      .patch<{ service_order: ServiceOrder }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.service_order));
  }

  /** Avanza el proceso un paso: received → in_process → ready → delivered. */
  changeStatus(id: number, process_status: ProcessStatus): Observable<ServiceOrder> {
    return this.http
      .patch<{ service_order: ServiceOrder }>(`${this.base}/${id}/estado`, { process_status })
      .pipe(map((r) => r.service_order));
  }

  /** Anulación (borrado lógico de la orden y sus líneas). */
  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  /** Borrado físico de la orden y sus líneas. */
  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
