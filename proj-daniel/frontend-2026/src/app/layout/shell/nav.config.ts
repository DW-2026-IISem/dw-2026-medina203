/** Elemento del menú lateral. */
export interface NavItem {
  label: string;
  icon: string;
  routerLink: string;
  /** Resaltar solo con la URL exacta (evita que /ordenes se marque en /ordenes/nueva). */
  exact?: boolean;
  /** Permiso `METHOD /ruta` que debe tener el rol para ver el elemento. */
  permission?: string;
}

/** Grupo de elementos del menú. */
export interface NavGroup {
  label: string;
  /** Solo tiene sentido con autenticación real (se oculta si requireAuth = false). */
  authOnly?: boolean;
  items: NavItem[];
}

/**
 * Menú de TextilClean. El Shell oculta cada elemento cuyo permiso no tenga el
 * usuario y los grupos que queden vacíos. Es UX: el backend vuelve a validar.
 */
export const NAV: NavGroup[] = [
  {
    label: 'Operación',
    items: [
      {
        label: 'Panel',
        icon: 'pi pi-chart-bar',
        routerLink: '/panel',
        permission: 'GET /api/ordenes',
      },
      {
        label: 'Órdenes',
        icon: 'pi pi-inbox',
        routerLink: '/ordenes',
        exact: true,
        permission: 'GET /api/ordenes',
      },
      {
        label: 'Nueva orden',
        icon: 'pi pi-plus-circle',
        routerLink: '/ordenes/nueva',
        permission: 'POST /api/ordenes',
      },
      {
        label: 'Detalle de órdenes',
        icon: 'pi pi-list',
        routerLink: '/detalle-ordenes',
        permission: 'GET /api/detalle-ordenes',
      },
    ],
  },
  {
    label: 'Catálogos',
    items: [
      {
        label: 'Clientes',
        icon: 'pi pi-building',
        routerLink: '/clientes',
        permission: 'GET /api/clientes',
      },
      {
        label: 'Tipos de prenda',
        icon: 'pi pi-tags',
        routerLink: '/tipos-prenda',
        permission: 'GET /api/tipos-prenda',
      },
      {
        label: 'Servicios',
        icon: 'pi pi-sparkles',
        routerLink: '/servicios',
        permission: 'GET /api/servicios',
      },
    ],
  },
  {
    label: 'Cuenta',
    items: [{ label: 'Mi perfil', icon: 'pi pi-user', routerLink: '/perfil' }],
  },
];
