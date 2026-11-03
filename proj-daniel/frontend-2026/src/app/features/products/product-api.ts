import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductCreatePayload, ProductUpdatePayload } from '../../core/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/productos`;

  list(): Observable<Product[]> {
    return this.http
      .get<{ products: Product[] }>(this.base)
      .pipe(map((r) => r.products));
  }

  get(id: number): Observable<Product> {
    return this.http
      .get<{ product: Product }>(`${this.base}/${id}`)
      .pipe(map((r) => r.product));
  }

  create(payload: ProductCreatePayload): Observable<Product> {
    return this.http
      .post<{ product: Product }>(this.base, payload)
      .pipe(map((r) => r.product));
  }

  update(id: number, payload: Partial<ProductUpdatePayload>): Observable<Product> {
    return this.http
      .patch<{ product: Product }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.product));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
