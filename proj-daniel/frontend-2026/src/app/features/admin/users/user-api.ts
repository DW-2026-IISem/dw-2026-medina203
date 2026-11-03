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

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuarios`;

  list(): Observable<User[]> {
    return this.http
      .get<{ users: User[] }>(this.base)
      .pipe(map((r) => r.users));
  }

  get(id: number): Observable<User> {
    return this.http
      .get<{ user: User }>(`${this.base}/${id}`)
      .pipe(map((r) => r.user));
  }

  /** POST /api/usuarios — CreateUserDto (password obligatorio). */
  create(payload: UserCreatePayload): Observable<User> {
    return this.http
      .post<{ user: User }>(this.base, payload)
      .pipe(map((r) => r.user));
  }

  /** PATCH /api/usuarios/:id — UpdateUserDto parcial. `password` va por /password. */
  update(id: number, payload: Partial<UserUpdatePayload>): Observable<User> {
    return this.http
      .patch<{ user: User }>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.user));
  }

  /** GET /api/usuarios/:id/permisos — permisos efectivos (roles + recursos). */
  permissions(id: number): Observable<EffectivePermission[]> {
    return this.http
      .get<{ permissions: EffectivePermission[] }>(`${this.base}/${id}/permisos`)
      .pipe(map((r) => r.permissions));
  }

  /** PATCH /api/usuarios/:id/password — devuelve { message, id }. */
  changePassword(
    id: number,
    payload: ChangePasswordPayload,
  ): Observable<{ message: string; id: number }> {
    return this.http.patch<{ message: string; id: number }>(
      `${this.base}/${id}/password`,
      payload,
    );
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
