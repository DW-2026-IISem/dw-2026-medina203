export interface NavItem {
  label: string;
  icon: string;
  routerLink: string;
  permission?: string;
}

export interface NavGroup {
  label: string;
  authOnly?: boolean;
  items: NavItem[];
}

/**
 * Catálogo estático de rutas. La visibilidad de cada item se decide en
 * `Shell.navGroups()` a partir de `SessionStore.canPermission()`.
 */
export const NAV: NavGroup[] = [
  {
    label: 'Operación',
    items: [
      {
        label: 'Panel',
        icon: 'pi pi-chart-line',
        routerLink: '/dashboard',
        permission: 'GET /api/ventas',
      },
      {
        label: 'Clientes',
        icon: 'pi pi-users',
        routerLink: '/clientes',
        permission: 'GET /api/clientes',
      },
      {
        label: 'Tipos de producto',
        icon: 'pi pi-tags',
        routerLink: '/tipos-producto',
        permission: 'GET /api/tipos-producto',
      },
      {
        label: 'Productos',
        icon: 'pi pi-box',
        routerLink: '/productos',
        permission: 'GET /api/productos',
      },
      {
        label: 'Ventas',
        icon: 'pi pi-shopping-cart',
        routerLink: '/ventas',
        permission: 'GET /api/ventas',
      },
      {
        label: 'Detalle de ventas',
        icon: 'pi pi-list',
        routerLink: '/detalle-ventas',
        permission: 'GET /api/detalle-ventas',
      },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      {
        label: 'Mi perfil',
        icon: 'pi pi-user',
        routerLink: '/perfil',
      },
    ],
  },
  {
    label: 'Seguridad',
    authOnly: true,
    items: [
      // Los items /admin/* se añaden en ISS-10 con sus permisos.
    ],
  },
];
