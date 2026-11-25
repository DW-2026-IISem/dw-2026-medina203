import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Role, RoleCreatePayload, RoleUpdatePayload } from '../../../core/models/role.model';

/** Contrato de `/roles`. */
@Injectable({ providedIn: 'root' })
export class RoleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/roles`;

  list(): Observable<Role[]> {
    return this.http.get<{ roles: Role[] }>(this.base).pipe(map((r) => r.roles));
  }

  create(payload: RoleCreatePayload): Observable<Role> {
    return this.http.post<{ role: Role }>(this.base, payload).pipe(map((r) => r.role));
  }

  update(id: number, payload: Partial<RoleUpdatePayload>): Observable<Role> {
    return this.http.patch<{ role: Role }>(`${this.base}/${id}`, payload).pipe(map((r) => r.role));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
