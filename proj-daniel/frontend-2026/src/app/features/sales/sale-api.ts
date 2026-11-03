import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Sale,
  SaleCreatePayload,
  SaleUpdatePayload,
} from '../../core/models/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ventas`;

  list(): Observable<Sale[]> {
    return this.http
      .get<{ sales: Sale[] }>(this.base)
      .pipe(map((r) => r.sales));
  }

  get(id: number): Observable<Sale> {
    return this.http
      .get<{ sale: Sale }>(`${this.base}/${id}`)
      .pipe(map((r) => r.sale));
  }

  /** POST /api/ventas devuelve { sale }. El detalle queda en /api/detalle-ventas. */
  create(payload: SaleCreatePayload): Observable<Sale> {
    return this.http
      .post<{ sale: Sale }>(this.base, payload)
      .pipe(map((r) => r.sale));
  }

  update(id: number, payload: SaleUpdatePayload): Observable<Sale> {
    return this.http
      .patch<{ sale: Sale }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.sale));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
