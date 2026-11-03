import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductSale, ProductSalePayload } from '../../core/models/product-sale.model';

/** /api/detalle-ventas — agregar/editar líneas ajusta stock y totales. */
@Injectable({ providedIn: 'root' })
export class ProductSaleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/detalle-ventas`;

  list(): Observable<ProductSale[]> {
    return this.http
      .get<{ product_sales: ProductSale[] }>(this.base)
      .pipe(map((response) => response.product_sales));
  }

  get(id: number): Observable<ProductSale> {
    return this.http
      .get<{ product_sale: ProductSale }>(`${this.base}/${id}`)
      .pipe(map((response) => response.product_sale));
  }

  create(payload: ProductSalePayload): Observable<ProductSale> {
    return this.http
      .post<{ product_sale: ProductSale }>(this.base, payload)
      .pipe(map((response) => response.product_sale));
  }

  /** PATCH solo acepta `quantity`: el estado se cambia con `/deactivate`. */
  update(id: number, payload: { quantity: number }): Observable<ProductSale> {
    return this.http
      .patch<{ product_sale: ProductSale }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.product_sale));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
