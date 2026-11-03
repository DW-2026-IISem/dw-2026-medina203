import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductType, ProductTypePayload } from '../../core/models/product-type.model';

/** /api/tipos-producto — la respuesta usa snake_case `product_types`. */
@Injectable({ providedIn: 'root' })
export class ProductTypeApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tipos-producto`;

  list(): Observable<ProductType[]> {
    return this.http
      .get<{ product_types: ProductType[] }>(this.base)
      .pipe(map((response) => response.product_types));
  }

  get(id: number): Observable<ProductType> {
    return this.http
      .get<{ product_type: ProductType }>(`${this.base}/${id}`)
      .pipe(map((response) => response.product_type));
  }

  create(payload: ProductTypePayload): Observable<ProductType> {
    return this.http
      .post<{ product_type: ProductType }>(this.base, payload)
      .pipe(map((response) => response.product_type));
  }

  update(id: number, payload: Partial<ProductTypePayload>): Observable<ProductType> {
    return this.http
      .patch<{ product_type: ProductType }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.product_type));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
