import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProductSale,
  ProductSaleCreatePayload,
  ProductSaleUpdatePayload,
} from '../../core/models/product-sale.model';

@Injectable({ providedIn: 'root' })
export class ProductSaleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/detalle-ventas`;

  list(): Observable<ProductSale[]> {
    return this.http
      .get<{ product_sales: ProductSale[] }>(this.base)
      .pipe(map((r) => r.product_sales));
  }

  get(id: number): Observable<ProductSale> {
    return this.http
      .get<{ product_sale: ProductSale }>(`${this.base}/${id}`)
      .pipe(map((r) => r.product_sale));
  }

  /** POST /api/detalle-ventas — el precio unitario lo calcula el backend. */
  create(payload: ProductSaleCreatePayload): Observable<ProductSale> {
    return this.http
      .post<{ product_sale: ProductSale }>(this.base, payload)
      .pipe(map((r) => r.product_sale));
  }

  /** PATCH sólo acepta quantity: el precio lo fija el backend. */
  update(
    id: number,
    payload: Partial<ProductSaleUpdatePayload>,
  ): Observable<ProductSale> {
    return this.http
      .patch<{ product_sale: ProductSale }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.product_sale));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
