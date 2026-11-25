import { HttpMethod, Resource } from '../../../core/models/resource.model';

/**
 * Agrupación del catálogo de recursos en la matriz C/R/U/D (ISS-CR-03).
 *
 *   recurso → entidad (segmento tras /api/) → fila
 *           → operación según método y forma del path → IDs de recursos
 *
 * Reglas acordadas en ISS-CR-00 (backend/docs/issues):
 *   Crear (C)      POST   /api/<entidad>
 *   Leer (R)       GET    /api/<entidad> y /api/<entidad>/:id
 *   Actualizar (U) PUT y PATCH /api/<entidad>/:id
 *   Eliminar (D)   DELETE /api/<entidad>/:id
 *   Especiales     cualquier ruta con segmento tras :id
 *                  (deactivate, reactivate, ordenes/:id/estado, usuarios/:id/password…)
 *
 * Es presentación: la autorización real la decide Express en cada petición.
 */
export type CrudOperation = 'create' | 'read' | 'update' | 'delete';

export interface CrudColumn {
  key: CrudOperation;
  label: string;
  letter: 'C' | 'R' | 'U' | 'D';
  methods: string;
}

export const CRUD_COLUMNS: readonly CrudColumn[] = [
  { key: 'create', label: 'Crear', letter: 'C', methods: 'POST' },
  { key: 'read', label: 'Leer', letter: 'R', methods: 'GET' },
  { key: 'update', label: 'Actualizar', letter: 'U', methods: 'PUT + PATCH' },
  { key: 'delete', label: 'Eliminar', letter: 'D', methods: 'DELETE' },
];

export type MatrixSection = 'Negocio' | 'Seguridad' | 'Otros';

export interface PermissionMatrixRow {
  entity: string;
  label: string;
  section: MatrixSection;
  operations: Record<CrudOperation, Resource[]>;
  special: Resource[];
  /** Todos los IDs de la fila (para contar marcados por entidad). */
  resourceIds: number[];
}

export type GrantState = 'all' | 'some' | 'none';

const ENTITIES: Record<string, { label: string; section: MatrixSection }> = {
  clientes: { label: 'Clientes', section: 'Negocio' },
  'tipos-prenda': { label: 'Tipos de prenda', section: 'Negocio' },
  servicios: { label: 'Servicios de lavandería', section: 'Negocio' },
  ordenes: { label: 'Órdenes de servicio', section: 'Negocio' },
  'detalle-ordenes': { label: 'Detalle de órdenes', section: 'Negocio' },
  usuarios: { label: 'Usuarios', section: 'Seguridad' },
  roles: { label: 'Roles', section: 'Seguridad' },
  recursos: { label: 'Recursos', section: 'Seguridad' },
  'asignaciones-rol': { label: 'Asignaciones usuario ↔ rol', section: 'Seguridad' },
  'concesiones-rol': { label: 'Concesiones rol ↔ recurso', section: 'Seguridad' },
};

const SECTION_ORDER: readonly MatrixSection[] = ['Negocio', 'Seguridad', 'Otros'];

/** Entidad de un path: `/api/tipos-prenda/:id` → `tipos-prenda`. */
export function entityOf(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments[0] === 'api' && segments[1]) return segments[1];
  return segments[0] ?? '/';
}

/** Operación C/R/U/D del recurso, o `null` si es una acción especial. */
export function crudOperationOf(method: HttpMethod, path: string): CrudOperation | null {
  const segments = path.split('/').filter(Boolean);
  const rest = segments[0] === 'api' ? segments.slice(2) : segments.slice(1);
  if (rest.length === 0) {
    if (method === 'GET') return 'read';
    if (method === 'POST') return 'create';
    return null;
  }
  if (rest.length === 1 && rest[0].startsWith(':')) {
    if (method === 'GET') return 'read';
    if (method === 'PUT' || method === 'PATCH') return 'update';
    if (method === 'DELETE') return 'delete';
  }
  return null;
}

function labelOf(entity: string): { label: string; section: MatrixSection } {
  const known = ENTITIES[entity];
  if (known) return known;
  const label = entity.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  return { label, section: 'Otros' };
}

/** Agrupa el catálogo en filas por entidad, ordenadas por sección y por aparición. */
export function buildPermissionMatrix(resources: readonly Resource[]): PermissionMatrixRow[] {
  const rows = new Map<string, PermissionMatrixRow>();
  const sorted = [...resources].sort((a, b) => a.id - b.id);

  for (const resource of sorted) {
    const entity = entityOf(resource.path);
    let row = rows.get(entity);
    if (!row) {
      row = {
        entity,
        ...labelOf(entity),
        operations: { create: [], read: [], update: [], delete: [] },
        special: [],
        resourceIds: [],
      };
      rows.set(entity, row);
    }
    const operation = crudOperationOf(resource.method, resource.path);
    if (operation) row.operations[operation].push(resource);
    else row.special.push(resource);
    row.resourceIds.push(resource.id);
  }

  return [...rows.values()].sort(
    (a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section),
  );
}

/** Estado de una casilla que agrupa varios recursos. Un grupo vacío es `none`. */
export function grantState(ids: readonly number[], selected: ReadonlySet<number>): GrantState {
  if (ids.length === 0) return 'none';
  const granted = ids.filter((id) => selected.has(id)).length;
  if (granted === 0) return 'none';
  return granted === ids.length ? 'all' : 'some';
}

/** Marca o desmarca TODOS los recursos del grupo (devuelve un Set nuevo). */
export function toggleIds(
  selected: ReadonlySet<number>,
  ids: readonly number[],
  checked: boolean,
): Set<number> {
  const next = new Set(selected);
  for (const id of ids) {
    if (checked) next.add(id);
    else next.delete(id);
  }
  return next;
}

/** Cuántos IDs difieren entre dos conjuntos (cambios sin guardar). */
export function countChanges(a: ReadonlySet<number>, b: ReadonlySet<number>): number {
  let changes = 0;
  for (const id of a) if (!b.has(id)) changes += 1;
  for (const id of b) if (!a.has(id)) changes += 1;
  return changes;
}

/** Nombre corto de una acción especial: descripción del backend o `METHOD /ruta`. */
export function specialLabel(resource: Resource): string {
  return resource.description?.trim() || `${resource.method} ${resource.path}`;
}
