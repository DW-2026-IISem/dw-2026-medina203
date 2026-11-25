/** Elemento del menú lateral. */
export interface NavItem {
  label: string;
  icon: string;
  routerLink: string;
}

/** Grupo de elementos del menú. */
export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Menú de TextilClean. Cada issue agrega su pantalla aquí; ISS-09 añade el
 * permiso que exige cada elemento para filtrarlo por rol.
 */
export const NAV: NavGroup[] = [
  {
    label: 'Operación',
    items: [
      { label: 'Inicio', icon: 'pi pi-home', routerLink: '/inicio' },
      { label: 'Clientes', icon: 'pi pi-building', routerLink: '/clientes' },
      { label: 'Tipos de prenda', icon: 'pi pi-tags', routerLink: '/tipos-prenda' },
    ],
  },
];
