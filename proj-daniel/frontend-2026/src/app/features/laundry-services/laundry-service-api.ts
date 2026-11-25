import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LaundryService,
  LaundryServiceCreatePayload,
  LaundryServiceUpdatePayload,
} from '../../core/models/laundry-service.model';

/** Contrato de `/servicios` en app-textilclean-express. */
@Injectable({ providedIn: 'root' })
export class LaundryServiceApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/servicios`;

  list(): Observable<LaundryService[]> {
    return this.http
      .get<{ laundry_services: LaundryService[] }>(this.base)
      .pipe(map((r) => r.laundry_services));
  }

  get(id: number): Observable<LaundryService> {
    return this.http
      .get<{ laundry_service: LaundryService }>(`${this.base}/${id}`)
      .pipe(map((r) => r.laundry_service));
  }

  create(payload: LaundryServiceCreatePayload): Observable<LaundryService> {
    return this.http
      .post<{ laundry_service: LaundryService }>(this.base, payload)
      .pipe(map((r) => r.laundry_service));
  }

  /** PATCH: actualización parcial (la que usan los formularios). */
  update(id: number, payload: Partial<LaundryServiceUpdatePayload>): Observable<LaundryService> {
    return this.http
      .patch<{ laundry_service: LaundryService }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.laundry_service));
  }

  /** PUT: reemplazo completo. */
  replace(id: number, payload: LaundryServiceUpdatePayload): Observable<LaundryService> {
    return this.http
      .put<{ laundry_service: LaundryService }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.laundry_service));
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
