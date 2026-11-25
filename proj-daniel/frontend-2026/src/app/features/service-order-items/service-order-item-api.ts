import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ServiceOrderItem,
  ServiceOrderItemCreatePayload,
  ServiceOrderItemUpdatePayload,
} from '../../core/models/service-order-item.model';

/** Contrato de `/detalle-ordenes`. Cada cambio recalcula los totales de la orden. */
@Injectable({ providedIn: 'root' })
export class ServiceOrderItemApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/detalle-ordenes`;

  list(serviceOrderId?: number): Observable<ServiceOrderItem[]> {
    const params = serviceOrderId
      ? new HttpParams().set('service_order_id', serviceOrderId)
      : new HttpParams();
    return this.http
      .get<{ service_order_items: ServiceOrderItem[] }>(this.base, { params })
      .pipe(map((r) => r.service_order_items));
  }

  create(payload: ServiceOrderItemCreatePayload): Observable<ServiceOrderItem> {
    return this.http
      .post<{ service_order_item: ServiceOrderItem }>(this.base, payload)
      .pipe(map((r) => r.service_order_item));
  }

  update(id: number, payload: ServiceOrderItemUpdatePayload): Observable<ServiceOrderItem> {
    return this.http
      .patch<{ service_order_item: ServiceOrderItem }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.service_order_item));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
