import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  GarmentType,
  GarmentTypeCreatePayload,
  GarmentTypeUpdatePayload,
} from '../../core/models/garment-type.model';

/** Contrato de `/tipos-prenda` en app-textilclean-express. */
@Injectable({ providedIn: 'root' })
export class GarmentTypeApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tipos-prenda`;

  list(): Observable<GarmentType[]> {
    return this.http
      .get<{ garment_types: GarmentType[] }>(this.base)
      .pipe(map((r) => r.garment_types));
  }

  get(id: number): Observable<GarmentType> {
    return this.http
      .get<{ garment_type: GarmentType }>(`${this.base}/${id}`)
      .pipe(map((r) => r.garment_type));
  }

  create(payload: GarmentTypeCreatePayload): Observable<GarmentType> {
    return this.http
      .post<{ garment_type: GarmentType }>(this.base, payload)
      .pipe(map((r) => r.garment_type));
  }

  /** PATCH: actualización parcial (la que usan los formularios). */
  update(id: number, payload: Partial<GarmentTypeUpdatePayload>): Observable<GarmentType> {
    return this.http
      .patch<{ garment_type: GarmentType }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.garment_type));
  }

  /** PUT: reemplazo completo. */
  replace(id: number, payload: GarmentTypeUpdatePayload): Observable<GarmentType> {
    return this.http
      .put<{ garment_type: GarmentType }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.garment_type));
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
