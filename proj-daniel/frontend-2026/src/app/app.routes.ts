import { Routes } from '@angular/router';

/**
 * Rutas de TextilClean. Todas las pantallas viven dentro del Shell y se cargan
 * de forma diferida (`loadComponent`).
 */
export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · TextilClean',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'forbidden',
    title: 'Acceso denegado · TextilClean',
    loadComponent: () => import('./features/auth/forbidden/forbidden').then((m) => m.Forbidden),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'panel' },
      {
        path: 'panel',
        title: 'Panel · TextilClean',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'perfil',
        title: 'Mi perfil · TextilClean',
        loadComponent: () => import('./features/auth/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'clientes',
        title: 'Clientes · TextilClean',
        loadComponent: () =>
          import('./features/customers/customer-list/customer-list').then((m) => m.CustomerList),
      },
      {
        path: 'tipos-prenda',
        title: 'Tipos de prenda · TextilClean',
        loadComponent: () =>
          import('./features/garment-types/garment-type-list/garment-type-list').then(
            (m) => m.GarmentTypeList,
          ),
      },
      {
        path: 'servicios',
        title: 'Servicios · TextilClean',
        loadComponent: () =>
          import('./features/laundry-services/laundry-service-list/laundry-service-list').then(
            (m) => m.LaundryServiceList,
          ),
      },
      {
        path: 'ordenes',
        title: 'Órdenes de servicio · TextilClean',
        loadComponent: () =>
          import('./features/service-orders/service-order-list/service-order-list').then(
            (m) => m.ServiceOrderList,
          ),
      },
      {
        path: 'ordenes/nueva',
        title: 'Nueva orden · TextilClean',
        loadComponent: () =>
          import('./features/service-orders/service-order-form/service-order-form').then(
            (m) => m.ServiceOrderForm,
          ),
      },
      {
        path: 'detalle-ordenes',
        title: 'Detalle de órdenes · TextilClean',
        loadComponent: () =>
          import('./features/service-order-items/service-order-item-list/service-order-item-list').then(
            (m) => m.ServiceOrderItemList,
          ),
      },
      { path: '**', redirectTo: 'panel' },
    ],
  },
];
