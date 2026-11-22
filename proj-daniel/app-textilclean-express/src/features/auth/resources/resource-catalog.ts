/**
 * Catálogo de seguridad de TextilClean: TODAS las operaciones protegidas por
 * RBAC (`authenticate` + `authorize`).
 *
 * - ADMIN recibe todo el catálogo.
 * - OPERATOR (operario de planta) recibe solo las marcadas con `operator: true`:
 *   consulta catálogos, registra clientes y órdenes, agrega/edita líneas y
 *   avanza el estado del proceso. No borra, no cambia precios ni administra seguridad.
 *
 * Las operaciones OPEN (login/refresh/logout, docs) y las JWT-only (perfil,
 * permisos propios, sesiones propias) NO van aquí.
 *
 * Para proteger una ruta nueva: agrégala aquí, ejecuta `npm run db:seed`
 * (o regístrala en caliente con POST /api/recursos + POST /api/concesiones-rol).
 */
export interface CatalogResource {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  operator?: boolean;
}

export const RESOURCE_CATALOG: readonly CatalogResource[] = [
  // ===== Negocio: clientes =====
  { method: "GET", path: "/api/clientes", description: "Listar clientes", operator: true },
  { method: "GET", path: "/api/clientes/:id", description: "Consultar cliente", operator: true },
  { method: "POST", path: "/api/clientes", description: "Registrar cliente", operator: true },
  { method: "PUT", path: "/api/clientes/:id", description: "Reemplazar cliente" },
  { method: "PATCH", path: "/api/clientes/:id", description: "Modificar cliente" },
  { method: "DELETE", path: "/api/clientes/:id", description: "Eliminar cliente" },
  { method: "PATCH", path: "/api/clientes/:id/deactivate", description: "Desactivar cliente" },

  // ===== Negocio: tipos de prenda =====
  { method: "GET", path: "/api/tipos-prenda", description: "Listar tipos de prenda", operator: true },
  { method: "GET", path: "/api/tipos-prenda/:id", description: "Consultar tipo de prenda", operator: true },
  { method: "POST", path: "/api/tipos-prenda", description: "Crear tipo de prenda" },
  { method: "PUT", path: "/api/tipos-prenda/:id", description: "Reemplazar tipo de prenda" },
  { method: "PATCH", path: "/api/tipos-prenda/:id", description: "Modificar tipo de prenda" },
  { method: "DELETE", path: "/api/tipos-prenda/:id", description: "Eliminar tipo de prenda" },
  { method: "PATCH", path: "/api/tipos-prenda/:id/deactivate", description: "Desactivar tipo de prenda" },

  // ===== Negocio: servicios =====
  { method: "GET", path: "/api/servicios", description: "Listar servicios", operator: true },
  { method: "GET", path: "/api/servicios/:id", description: "Consultar servicio", operator: true },
  { method: "POST", path: "/api/servicios", description: "Crear servicio" },
  { method: "PUT", path: "/api/servicios/:id", description: "Reemplazar servicio" },
  { method: "PATCH", path: "/api/servicios/:id", description: "Modificar servicio (precio, unidad…)" },
  { method: "DELETE", path: "/api/servicios/:id", description: "Eliminar servicio" },
  { method: "PATCH", path: "/api/servicios/:id/deactivate", description: "Desactivar servicio" },

  // ===== Negocio: órdenes de servicio =====
  { method: "GET", path: "/api/ordenes", description: "Listar órdenes", operator: true },
  { method: "GET", path: "/api/ordenes/:id", description: "Consultar orden", operator: true },
  { method: "POST", path: "/api/ordenes", description: "Registrar orden", operator: true },
  { method: "PUT", path: "/api/ordenes/:id", description: "Reemplazar datos de la orden" },
  { method: "PATCH", path: "/api/ordenes/:id", description: "Modificar datos de la orden", operator: true },
  { method: "PATCH", path: "/api/ordenes/:id/estado", description: "Avanzar estado del proceso", operator: true },
  { method: "DELETE", path: "/api/ordenes/:id", description: "Eliminar orden" },
  { method: "PATCH", path: "/api/ordenes/:id/deactivate", description: "Anular orden" },

  // ===== Negocio: detalle de órdenes =====
  { method: "GET", path: "/api/detalle-ordenes", description: "Listar líneas de órdenes", operator: true },
  { method: "GET", path: "/api/detalle-ordenes/:id", description: "Consultar línea de orden", operator: true },
  { method: "POST", path: "/api/detalle-ordenes", description: "Agregar línea a orden", operator: true },
  { method: "PUT", path: "/api/detalle-ordenes/:id", description: "Reemplazar cantidad/peso de línea", operator: true },
  { method: "PATCH", path: "/api/detalle-ordenes/:id", description: "Modificar cantidad/peso de línea", operator: true },
  { method: "DELETE", path: "/api/detalle-ordenes/:id", description: "Eliminar línea de orden" },
  { method: "PATCH", path: "/api/detalle-ordenes/:id/deactivate", description: "Desactivar línea de orden" },

  // ===== Seguridad: usuarios =====
  { method: "GET", path: "/api/usuarios", description: "Listar usuarios" },
  { method: "GET", path: "/api/usuarios/:id", description: "Consultar usuario" },
  { method: "POST", path: "/api/usuarios", description: "Crear usuario" },
  { method: "PUT", path: "/api/usuarios/:id", description: "Reemplazar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id", description: "Modificar usuario" },
  { method: "DELETE", path: "/api/usuarios/:id", description: "Eliminar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id/deactivate", description: "Desactivar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id/password", description: "Cambiar contraseña de un usuario" },
  { method: "GET", path: "/api/usuarios/:id/permisos", description: "Consultar permisos efectivos de un usuario" },

  // ===== Seguridad: roles =====
  { method: "GET", path: "/api/roles", description: "Listar roles" },
  { method: "GET", path: "/api/roles/:id", description: "Consultar rol" },
  { method: "POST", path: "/api/roles", description: "Crear rol" },
  { method: "PUT", path: "/api/roles/:id", description: "Reemplazar rol" },
  { method: "PATCH", path: "/api/roles/:id", description: "Modificar rol" },
  { method: "DELETE", path: "/api/roles/:id", description: "Eliminar rol" },
  { method: "PATCH", path: "/api/roles/:id/deactivate", description: "Desactivar rol" },

  // ===== Seguridad: recursos =====
  { method: "GET", path: "/api/recursos", description: "Listar recursos" },
  { method: "GET", path: "/api/recursos/:id", description: "Consultar recurso" },
  { method: "POST", path: "/api/recursos", description: "Crear recurso" },
  { method: "PUT", path: "/api/recursos/:id", description: "Reemplazar recurso" },
  { method: "PATCH", path: "/api/recursos/:id", description: "Modificar recurso" },
  { method: "DELETE", path: "/api/recursos/:id", description: "Eliminar recurso" },
  { method: "PATCH", path: "/api/recursos/:id/deactivate", description: "Desactivar recurso" },

  // ===== Seguridad: asignaciones usuario-rol (ISS-12) =====
  { method: "GET", path: "/api/asignaciones-rol", description: "Listar asignaciones usuario-rol" },
  { method: "GET", path: "/api/asignaciones-rol/:id", description: "Consultar asignación" },
  { method: "POST", path: "/api/asignaciones-rol", description: "Asignar rol a usuario" },
  { method: "PATCH", path: "/api/asignaciones-rol/:id/deactivate", description: "Retirar rol" },
  { method: "PATCH", path: "/api/asignaciones-rol/:id/reactivate", description: "Reactivar rol" },

  // ===== Seguridad: concesiones rol-recurso (ISS-12) =====
  { method: "GET", path: "/api/concesiones-rol", description: "Listar concesiones rol-recurso" },
  { method: "GET", path: "/api/concesiones-rol/:id", description: "Consultar concesión" },
  { method: "POST", path: "/api/concesiones-rol", description: "Conceder recurso a rol" },
  { method: "PATCH", path: "/api/concesiones-rol/:id/deactivate", description: "Retirar recurso" },
  { method: "PATCH", path: "/api/concesiones-rol/:id/reactivate", description: "Reactivar recurso" },
];

export const OPERATOR_RESOURCES: readonly CatalogResource[] = RESOURCE_CATALOG.filter(
  (resource) => resource.operator === true
);
