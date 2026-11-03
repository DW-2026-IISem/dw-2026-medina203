import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Sale,
  SaleCreatePayload,
  SaleUpdatePayload,
} from '../../core/models/sale.model';

/** /api/ventas — POST es transaccional (cabecera + detalle + stock). */
@Injectable({ providedIn: 'root' })
export class SaleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ventas`;

  list(): Observable<Sale[]> {
    return this.http
      .get<{ sales: Sale[] }>(this.base)
      .pipe(map((response) => response.sales));
  }

  get(id: number): Observable<Sale> {
    return this.http
      .get<{ sale: Sale }>(`${this.base}/${id}`)
      .pipe(map((response) => response.sale));
  }

  /** POST transaccional: devuelve `{ sale, items }`; el stock ya está descontado. */
  create(payload: SaleCreatePayload): Observable<Sale> {
    return this.http
      .post<{ sale: Sale; items: unknown[] }>(this.base, payload)
      .pipe(map((response) => response.sale));
  }

  update(id: number, payload: SaleUpdatePayload): Observable<Sale> {
    return this.http
      .patch<{ sale: Sale }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.sale));
  }

  /** Cancelación: la venta y sus líneas pasan a inactive y el backend restaura el stock. */
  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  /** DELETE físico: borra primero product_sales y luego la cabecera. */
  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
