import { Resource } from '../../../core/models/resource.model';
import {
  buildPermissionMatrix,
  countChanges,
  crudOperationOf,
  entityOf,
  grantState,
  specialLabel,
  toggleIds,
} from './permission-matrix';

const res = (id: number, method: Resource['method'], path: string, description: string | null = null): Resource => ({
  id,
  method,
  path,
  description,
  status: 'active',
});

/** Catálogo reducido con la forma real de TextilClean. */
const CATALOG: Resource[] = [
  res(1, 'GET', '/api/clientes'),
  res(2, 'GET', '/api/clientes/:id'),
  res(3, 'POST', '/api/clientes'),
  res(4, 'PUT', '/api/clientes/:id'),
  res(5, 'PATCH', '/api/clientes/:id'),
  res(6, 'DELETE', '/api/clientes/:id'),
  res(7, 'PATCH', '/api/clientes/:id/deactivate', 'Desactivar cliente'),
  res(8, 'PATCH', '/api/ordenes/:id/estado', 'Avanzar estado del proceso'),
  res(9, 'GET', '/api/ordenes'),
  res(10, 'GET', '/api/asignaciones-rol'),
  res(11, 'POST', '/api/asignaciones-rol'),
  res(12, 'PATCH', '/api/asignaciones-rol/:id/reactivate'),
  res(13, 'GET', '/api/reportes/ordenes'),
];

describe('permission-matrix (agrupación C/R/U/D)', () => {
  it('entityOf toma el segmento tras /api/', () => {
    expect(entityOf('/api/tipos-prenda/:id')).toBe('tipos-prenda');
    expect(entityOf('/api/ordenes/:id/estado')).toBe('ordenes');
  });

  it('crudOperationOf: PUT y PATCH :id son Actualizar; rutas tras :id son especiales', () => {
    expect(crudOperationOf('POST', '/api/clientes')).toBe('create');
    expect(crudOperationOf('GET', '/api/clientes')).toBe('read');
    expect(crudOperationOf('GET', '/api/clientes/:id')).toBe('read');
    expect(crudOperationOf('PUT', '/api/clientes/:id')).toBe('update');
    expect(crudOperationOf('PATCH', '/api/clientes/:id')).toBe('update');
    expect(crudOperationOf('DELETE', '/api/clientes/:id')).toBe('delete');
    expect(crudOperationOf('PATCH', '/api/ordenes/:id/estado')).toBeNull();
    expect(crudOperationOf('PATCH', '/api/clientes/:id/deactivate')).toBeNull();
  });

  it('agrupa por entidad, con secciones Negocio → Seguridad → Otros', () => {
    const rows = buildPermissionMatrix([...CATALOG].reverse());
    expect(rows.map((r) => r.entity)).toEqual(['clientes', 'ordenes', 'asignaciones-rol', 'reportes']);
    expect(rows.map((r) => r.section)).toEqual(['Negocio', 'Negocio', 'Seguridad', 'Otros']);
    const clientes = rows[0];
    expect(clientes.label).toBe('Clientes');
    expect(clientes.operations.read.map((r) => r.id)).toEqual([1, 2]);
    expect(clientes.operations.update.map((r) => r.id)).toEqual([4, 5]);
    expect(clientes.special.map((r) => r.id)).toEqual([7]);
    expect(clientes.resourceIds).toHaveLength(7);
    expect(rows[1].special.map((r) => r.id)).toEqual([8]);
    expect(rows[2].operations.update).toEqual([]);
    expect(rows[2].operations.delete).toEqual([]);
    expect(rows[3].label).toBe('Reportes');
  });

  it('grantState: todos, ninguno y parcial (grupo vacío = ninguno)', () => {
    const selected = new Set([1, 4]);
    expect(grantState([1], selected)).toBe('all');
    expect(grantState([1, 2], selected)).toBe('some');
    expect(grantState([3], selected)).toBe('none');
    expect(grantState([], selected)).toBe('none');
  });

  it('toggleIds marca o desmarca TODOS los IDs del grupo sin mutar el Set original', () => {
    const original = new Set([1]);
    const marked = toggleIds(original, [1, 2], true);
    expect([...marked].sort()).toEqual([1, 2]);
    expect([...toggleIds(marked, [1, 2], false)]).toEqual([]);
    expect([...original]).toEqual([1]);
  });

  it('countChanges cuenta altas y bajas pendientes', () => {
    expect(countChanges(new Set([1, 2, 3]), new Set([2, 3, 4]))).toBe(2);
    expect(countChanges(new Set(), new Set())).toBe(0);
  });

  it('specialLabel usa la descripción o METHOD /ruta', () => {
    expect(specialLabel(CATALOG[7])).toBe('Avanzar estado del proceso');
    expect(specialLabel(CATALOG[11])).toBe('PATCH /api/asignaciones-rol/:id/reactivate');
  });
});
