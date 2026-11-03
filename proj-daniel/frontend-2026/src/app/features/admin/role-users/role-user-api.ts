import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RoleUser } from '../../../core/models/role-user.model';

@Injectable({ providedIn: 'root' })
export class RoleUserApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/asignaciones-rol`;

  /** Envoltura { assignments }, no { role_users }. */
  list(): Observable<RoleUser[]> {
    return this.http
      .get<{ assignments: RoleUser[] }>(this.base)
      .pipe(map((r) => r.assignments));
  }

  get(id: number): Observable<RoleUser> {
    return this.http
      .get<{ assignment: RoleUser }>(`${this.base}/${id}`)
      .pipe(map((r) => r.assignment));
  }

  assign(payload: { user_id: number; role_id: number }): Observable<RoleUser> {
    return this.http
      .post<{ assignment: RoleUser }>(this.base, payload)
      .pipe(map((r) => r.assignment));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  reactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/reactivate`, {});
  }
}
