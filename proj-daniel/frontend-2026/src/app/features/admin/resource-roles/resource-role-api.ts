import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ResourceRole,
  ResourceRolePayload,
  RoleGrantReconciliation,
  RoleGrantReconciliationPayload,
} from '../../../core/models/resource-role.model';

/**
 * Contrato de `/concesiones-rol` (rol ↔ recurso = permiso).
 *
 * La pantalla no arma URLs ni interpreta respuestas: este cliente valida las
 * envolturas (`grants`, `grant`, `result`) y propaga un error legible si el
 * backend responde con otra forma. El token lo añade `authInterceptor`.
 */
@Injectable({ providedIn: 'root' })
export class ResourceRoleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/concesiones-rol`;

  /** GET /concesiones-rol (solo activas). Filtra con `HttpParams`, no concatenando texto. */
  list(filters?: { role_id?: number; resource_id?: number }): Observable<ResourceRole[]> {
    let params = new HttpParams();
    if (filters?.role_id) params = params.set('role_id', filters.role_id);
    if (filters?.resource_id) params = params.set('resource_id', filters.resource_id);
    return this.http
      .get<Record<string, unknown>>(this.base, { params })
      .pipe(map((response) => requiredGrants(response)));
  }

  /** Concesión individual `{ role_id, resource_id }` → `201 { grant }`. */
  create(payload: ResourceRolePayload): Observable<ResourceRole> {
    return this.http.post<{ grant: ResourceRole }>(this.base, payload).pipe(map((r) => r.grant));
  }

  /**
   * Guarda la matriz COMPLETA del rol: `{ role_id, resource_ids }` →
   * `200 { message, result }`. El backend activa, reactiva y revoca en una
   * transacción; aquí no se calcula ninguna diferencia.
   */
  reconcileRole(role_id: number, resource_ids: number[]): Observable<RoleGrantReconciliation> {
    const body: RoleGrantReconciliationPayload = { role_id, resource_ids };
    return this.http
      .post<Record<string, unknown>>(this.base, body)
      .pipe(map((response) => requiredReconciliation(response)));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  reactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/reactivate`, {});
  }
}

function requiredGrants(response: Record<string, unknown> | null): ResourceRole[] {
  const grants = response?.['grants'];
  if (!Array.isArray(grants)) {
    throw new Error('Respuesta inesperada de /concesiones-rol: falta la lista "grants"');
  }
  return grants as ResourceRole[];
}

function requiredReconciliation(response: Record<string, unknown> | null): RoleGrantReconciliation {
  const result = response?.['result'] as Partial<RoleGrantReconciliation> | undefined;
  const numeric = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
  if (
    !result ||
    !numeric(result.role_id) ||
    !numeric(result.activated) ||
    !numeric(result.deactivated) ||
    !numeric(result.total_active)
  ) {
    throw new Error('Respuesta inesperada al guardar la matriz: falta "result" con los conteos');
  }
  return result as RoleGrantReconciliation;
}
