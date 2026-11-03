import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Client, ClientCreatePayload, ClientUpdatePayload } from '../../core/models/client.model';

/** Contrato exacto de `features/business/clients` en Express. */
@Injectable({ providedIn: 'root' })
export class ClientApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/clientes`;

  list(): Observable<Client[]> {
    return this.http
      .get<{ clients: Client[] }>(this.base)
      .pipe(map((response) => response.clients));
  }

  get(id: number): Observable<Client> {
    return this.http
      .get<{ client: Client }>(`${this.base}/${id}`)
      .pipe(map((response) => response.client));
  }

  create(payload: ClientCreatePayload): Observable<Client> {
    return this.http
      .post<{ client: Client }>(this.base, payload)
      .pipe(map((response) => response.client));
  }

  /** PATCH /api/clientes/:id — actualización parcial (la que usa el formulario). */
  update(id: number, payload: Partial<ClientUpdatePayload>): Observable<Client> {
    return this.http
      .patch<{ client: Client }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.client));
  }

  /** PUT /api/clientes/:id — reemplazo completo. */
  replace(id: number, payload: ClientUpdatePayload): Observable<Client> {
    return this.http
      .put<{ client: Client }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.client));
  }

  /** Baja lógica: status = inactive. */
  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  /** Baja física: DELETE. */
  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
