import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EffectivePermission } from '../../../core/models/auth.model';
import {
  ChangePasswordPayload,
  User,
  UserCreatePayload,
  UserUpdatePayload,
} from '../../../core/models/user.model';

/** Contrato de `/usuarios` (personal de la lavandería). */
@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuarios`;

  list(): Observable<User[]> {
    return this.http.get<{ users: User[] }>(this.base).pipe(map((r) => r.users));
  }

  get(id: number): Observable<User> {
    return this.http.get<{ user: User }>(`${this.base}/${id}`).pipe(map((r) => r.user));
  }

  create(payload: UserCreatePayload): Observable<User> {
    return this.http.post<{ user: User }>(this.base, payload).pipe(map((r) => r.user));
  }

  update(id: number, payload: UserUpdatePayload): Observable<User> {
    return this.http.patch<{ user: User }>(`${this.base}/${id}`, payload).pipe(map((r) => r.user));
  }

  /** Permisos efectivos de un usuario (unión de sus roles activos). */
  permissions(id: number): Observable<EffectivePermission[]> {
    return this.http
      .get<{ permissions: EffectivePermission[] }>(`${this.base}/${id}/permisos`)
      .pipe(map((r) => r.permissions));
  }

  changePassword(id: number, payload: ChangePasswordPayload): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/password`, payload);
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
