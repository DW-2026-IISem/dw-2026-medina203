import { Routes } from '@angular/router';

/**
 * Rutas de TextilClean. Todas las pantallas viven dentro del Shell y se cargan
 * de forma diferida (`loadComponent`).
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio · TextilClean',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
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
      { path: '**', redirectTo: 'inicio' },
    ],
  },
];
