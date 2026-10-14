export interface CatalogResource {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  seller?: boolean;
}

export const RESOURCE_CATALOG: readonly CatalogResource[] = [
  { method: "GET", path: "/api/clientes", description: "Listar clientes", seller: true },
  { method: "GET", path: "/api/clientes/:id", description: "Consultar cliente", seller: true },
  { method: "POST", path: "/api/clientes", description: "Crear cliente" },
  { method: "PUT", path: "/api/clientes/:id", description: "Reemplazar cliente" },
  { method: "PATCH", path: "/api/clientes/:id", description: "Modificar cliente" },
  { method: "DELETE", path: "/api/clientes/:id", description: "Eliminar cliente" },
  { method: "PATCH", path: "/api/clientes/:id/deactivate", description: "Desactivar cliente" },

  { method: "GET", path: "/api/tipos-producto", description: "Listar tipos de producto" },
  { method: "GET", path: "/api/tipos-producto/:id", description: "Consultar tipo de producto" },
  { method: "POST", path: "/api/tipos-producto", description: "Crear tipo de producto" },
  { method: "PUT", path: "/api/tipos-producto/:id", description: "Reemplazar tipo de producto" },
  { method: "PATCH", path: "/api/tipos-producto/:id", description: "Modificar tipo de producto" },
  { method: "DELETE", path: "/api/tipos-producto/:id", description: "Eliminar tipo de producto" },
  { method: "PATCH", path: "/api/tipos-producto/:id/deactivate", description: "Desactivar tipo de producto" },

  { method: "GET", path: "/api/productos", description: "Listar productos", seller: true },
  { method: "GET", path: "/api/productos/:id", description: "Consultar producto", seller: true },
  { method: "POST", path: "/api/productos", description: "Crear producto" },
  { method: "PUT", path: "/api/productos/:id", description: "Reemplazar producto" },
  { method: "PATCH", path: "/api/productos/:id", description: "Modificar producto" },
  { method: "DELETE", path: "/api/productos/:id", description: "Eliminar producto" },
  { method: "PATCH", path: "/api/productos/:id/deactivate", description: "Desactivar producto" },

  { method: "GET", path: "/api/ventas", description: "Listar ventas", seller: true },
  { method: "GET", path: "/api/ventas/:id", description: "Consultar venta", seller: true },
  { method: "POST", path: "/api/ventas", description: "Registrar venta", seller: true },
  { method: "GET", path: "/api/detalle-ventas", description: "Listar detalle de ventas" },

  { method: "GET", path: "/api/usuarios", description: "Listar usuarios" },
  { method: "GET", path: "/api/usuarios/:id", description: "Consultar usuario" },
  { method: "POST", path: "/api/usuarios", description: "Crear usuario" },
  { method: "PUT", path: "/api/usuarios/:id", description: "Reemplazar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id", description: "Modificar usuario" },
  { method: "DELETE", path: "/api/usuarios/:id", description: "Eliminar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id/deactivate", description: "Desactivar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id/password", description: "Cambiar contraseña de usuario" },
  { method: "GET", path: "/api/usuarios/:id/permisos", description: "Consultar permisos efectivos" },

  { method: "GET", path: "/api/roles", description: "Listar roles" },
  { method: "GET", path: "/api/roles/:id", description: "Consultar rol" },
  { method: "POST", path: "/api/roles", description: "Crear rol" },
  { method: "PUT", path: "/api/roles/:id", description: "Reemplazar rol" },
  { method: "PATCH", path: "/api/roles/:id", description: "Modificar rol" },
  { method: "DELETE", path: "/api/roles/:id", description: "Eliminar rol" },
  { method: "PATCH", path: "/api/roles/:id/deactivate", description: "Desactivar rol" },

  { method: "GET", path: "/api/recursos", description: "Listar recursos" },
  { method: "GET", path: "/api/recursos/:id", description: "Consultar recurso" },
  { method: "POST", path: "/api/recursos", description: "Crear recurso" },
  { method: "PUT", path: "/api/recursos/:id", description: "Reemplazar recurso" },
  { method: "PATCH", path: "/api/recursos/:id", description: "Modificar recurso" },
  { method: "DELETE", path: "/api/recursos/:id", description: "Eliminar recurso" },
  { method: "PATCH", path: "/api/recursos/:id/deactivate", description: "Desactivar recurso" },

  { method: "GET", path: "/api/asignaciones-rol", description: "Listar asignaciones usuario-rol" },
  { method: "GET", path: "/api/asignaciones-rol/:id", description: "Consultar asignación" },
  { method: "POST", path: "/api/asignaciones-rol", description: "Asignar rol a usuario" },
  { method: "PATCH", path: "/api/asignaciones-rol/:id/deactivate", description: "Retirar rol" },
  { method: "PATCH", path: "/api/asignaciones-rol/:id/reactivate", description: "Reactivar rol" },

  { method: "GET", path: "/api/concesiones-rol", description: "Listar concesiones rol-recurso" },
  { method: "GET", path: "/api/concesiones-rol/:id", description: "Consultar concesión" },
  { method: "POST", path: "/api/concesiones-rol", description: "Conceder recurso a rol" },
  { method: "PATCH", path: "/api/concesiones-rol/:id/deactivate", description: "Retirar recurso" },
  { method: "PATCH", path: "/api/concesiones-rol/:id/reactivate", description: "Reactivar recurso" },
];

export const SELLER_RESOURCES: readonly CatalogResource[] = RESOURCE_CATALOG.filter(
  (resource) => resource.seller === true
);