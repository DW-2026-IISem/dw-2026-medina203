import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { environment } from '../../../../../environments/environment';
import { Resource } from '../../../../core/models/resource.model';
import { SessionStore } from '../../../../core/services/session-store';
import { PermissionMatrix } from './permission-matrix';

const API = environment.apiUrl;
const GRANTS = `${API}/concesiones-rol`;

const ROLES = [
  { id: 1, name: 'ADMIN', description: null, status: 'active' },
  { id: 2, name: 'OPERATOR', description: 'Operario', status: 'active' },
  { id: 9, name: 'VIEJO', description: null, status: 'inactive' },
];
const RESOURCES: Resource[] = [
  { id: 1, method: 'GET', path: '/api/clientes', description: 'Listar', status: 'active' },
  { id: 2, method: 'GET', path: '/api/clientes/:id', description: 'Consultar', status: 'active' },
  { id: 3, method: 'POST', path: '/api/clientes', description: 'Registrar', status: 'active' },
  { id: 4, method: 'DELETE', path: '/api/clientes/:id', description: 'Eliminar', status: 'active' },
  { id: 5, method: 'PATCH', path: '/api/ordenes/:id/estado', description: 'Avanzar estado', status: 'active' },
];
const grant = (role_id: number, resource_id: number) => ({ id: role_id * 100 + resource_id, role_id, resource_id, status: 'active' });

/** Da (o no) al usuario de la prueba el permiso de guardar la matriz. */
function signIn(canSave: boolean, roleIds: number[] = [1]): void {
  const session = TestBed.inject(SessionStore);
  session.setTokens({ access_token: 'a', refresh_token: 'r', token_type: 'Bearer', expires_in: 1, refresh_expires_in: 1 } as never);
  const permissions = [{ method: 'GET', path: '/api/concesiones-rol' }];
  if (canSave) permissions.push({ method: 'POST', path: '/api/concesiones-rol' });
  session.setAccess({
    user: null as never,
    permissions: roleIds.flatMap((role_id) =>
      permissions.map((p, i) => ({ resource_id: i, method: p.method as 'GET', path: p.path, description: null, role_id, role_name: `R${role_id}` })),
    ),
  });
}

describe('PermissionMatrix (ISS-CR-03/04)', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PermissionMatrix],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService, ConfirmationService],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.inject(SessionStore).clear();
  });

  /** Crea la pantalla y responde roles + recursos con las envolturas reales. */
  function open(roles = ROLES, resources = RESOURCES) {
    const page = TestBed.createComponent(PermissionMatrix).componentInstance;
    http.expectOne(`${API}/roles`).flush({ roles });
    http.expectOne(`${API}/recursos`).flush({ resources });
    return page;
  }

  function flushGrants(roleId: number, grants: unknown[]) {
    const req = http.expectOne((r) => r.url === GRANTS && r.method === 'GET');
    expect(req.request.params.get('role_id')).toBe(String(roleId));
    req.flush({ grants });
  }

  it('carga roles activos y recursos, elige el primer rol y consulta SUS concesiones', () => {
    signIn(true);
    const page = open();
    expect(page.roles().map((r) => r.name)).toEqual(['ADMIN', 'OPERATOR']);
    expect(page.selectedRoleId()).toBe(1);
    expect(page.loadingGrants()).toBe(true);
    expect(page.canSave()).toBe(false);
    flushGrants(1, [grant(1, 1), grant(1, 2), grant(1, 3)]);
    expect([...page.selectedResourceIds()].sort()).toEqual([1, 2, 3]);
    expect(page.rows().map((r) => r.entity)).toEqual(['clientes', 'ordenes']);
  });

  it('sin roles: no consulta concesiones ni falla', () => {
    signIn(true);
    const page = open([], RESOURCES);
    expect(page.selectedRoleId()).toBeNull();
    expect(page.error()).toBeNull();
  });

  it('cambiar de rol carga una matriz distinta y descarta la anterior', () => {
    signIn(true);
    const page = open();
    flushGrants(1, [grant(1, 1), grant(1, 2), grant(1, 3), grant(1, 4)]);
    page.setIds([5], true);
    page.selectRole(2);
    expect(page.selectedResourceIds().size).toBe(0);
    flushGrants(2, [grant(2, 1), grant(2, 5)]);
    expect([...page.selectedResourceIds()].sort()).toEqual([1, 5]);
    expect(page.pendingChanges()).toBe(0);
  });

  it('Leer agrupa lista + detalle: estado parcial y la casilla cambia ambos IDs', () => {
    signIn(true);
    const page = open();
    flushGrants(1, [grant(1, 1)]);
    const clientes = page.rows()[0];
    const read = page.idsOf(clientes, 'read');
    expect(read).toEqual([1, 2]);
    expect(page.isPartial(read)).toBe(true);
    expect(page.isGranted(read)).toBe(false);

    page.toggle(read, { target: { checked: true } } as unknown as Event);
    expect(page.isGranted(read)).toBe(true);
    page.toggle(read, { target: { checked: false } } as unknown as Event);
    expect(page.isGranted(read) || page.isPartial(read)).toBe(false);
    expect(page.pendingChanges()).toBe(1);
  });

  it('guardar envía el conjunto completo, muestra el resultado y recarga', () => {
    signIn(true, [2]);
    const page = open();
    flushGrants(1, [grant(1, 1)]);
    page.setIds([3, 2], true);
    page.savePermissionMatrix();
    page.savePermissionMatrix(); // doble clic: solo una petición

    const req = http.expectOne({ method: 'POST', url: GRANTS });
    expect(req.request.body).toEqual({ role_id: 1, resource_ids: [1, 2, 3] });
    expect(page.canSave()).toBe(false);
    req.flush({ message: 'Role permissions updated', result: { role_id: 1, activated: 2, deactivated: 0, total_active: 3 } });

    expect(page.saveMessage()).toContain('3 permisos activos');
    flushGrants(1, [grant(1, 1), grant(1, 2), grant(1, 3)]);
    expect(page.pendingChanges()).toBe(0);
  });

  it('guardar con lista vacía envía resource_ids: []', () => {
    signIn(true, [2]);
    const page = open();
    flushGrants(1, [grant(1, 1), grant(1, 5)]);
    page.unmarkAll();
    page.savePermissionMatrix();
    const req = http.expectOne({ method: 'POST', url: GRANTS });
    expect(req.request.body).toEqual({ role_id: 1, resource_ids: [] });
    req.flush({ message: 'ok', result: { role_id: 1, activated: 0, deactivated: 2, total_active: 0 } });
    flushGrants(1, []);
  });

  it('si el usuario edita un rol que él tiene, recarga sus permisos efectivos', () => {
    signIn(true, [1]);
    const page = open();
    flushGrants(1, [grant(1, 1)]);
    page.setIds([2], true);
    page.savePermissionMatrix();
    http.expectOne({ method: 'POST', url: GRANTS }).flush({ message: 'ok', result: { role_id: 1, activated: 1, deactivated: 0, total_active: 2 } });
    flushGrants(1, [grant(1, 1), grant(1, 2)]);
    http.expectOne(`${API}/sesion/perfil`).flush({ user: null });
    http.expectOne(`${API}/permisos`).flush({ permissions: [] });
  });

  it('un error del API se muestra y no se anuncia éxito', () => {
    signIn(true, [2]);
    const page = open();
    flushGrants(1, [grant(1, 1)]);
    page.unmarkAll();
    page.savePermissionMatrix();
    http
      .expectOne({ method: 'POST', url: GRANTS })
      .flush({ error: 'ADMIN must keep access to the permissions panel' }, { status: 409, statusText: 'Conflict' });
    expect(page.saveError()).toContain('ADMIN must keep access');
    expect(page.saveMessage()).toBeNull();
    expect(page.saving()).toBe(false);
    expect(page.pendingChanges()).toBe(1);
  });

  it('una respuesta sin "result" es un error, no un éxito', () => {
    signIn(true, [2]);
    const page = open();
    flushGrants(1, []);
    page.setIds([1], true);
    page.savePermissionMatrix();
    http.expectOne({ method: 'POST', url: GRANTS }).flush({ message: 'ok' });
    expect(page.saveError()).toContain('result');
    expect(page.saveMessage()).toBeNull();
  });

  it('no guarda mientras cargan las concesiones', () => {
    signIn(true);
    const page = open();
    page.setIds([1], true);
    page.savePermissionMatrix();
    http.expectNone({ method: 'POST', url: GRANTS });
    flushGrants(1, []);
  });

  it('sin POST /api/concesiones-rol la matriz es de solo lectura', () => {
    signIn(false);
    const page = open();
    flushGrants(1, []);
    expect(page.canEdit()).toBe(false);
    page.setIds([1], true);
    page.savePermissionMatrix();
    http.expectNone({ method: 'POST', url: GRANTS });
  });

  it('un error al cargar el catálogo se muestra', () => {
    signIn(true);
    const page = TestBed.createComponent(PermissionMatrix).componentInstance;
    http.expectOne(`${API}/roles`).flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    http.expectOne(`${API}/recursos`);
    expect(page.error()).toBe('Forbidden');
    expect(page.loadingCatalog()).toBe(false);
  });
});
