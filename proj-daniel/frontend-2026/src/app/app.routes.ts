import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · TextilClean',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'forbidden',
    title: 'Acceso denegado · TextilClean',
    loadComponent: () =>
      import('./features/auth/forbidden/forbidden').then((m) => m.Forbidden),
  },
  {
    path: 'construir',
    title: 'Prototipo · TextilClean',
    loadComponent: () =>
      import('./features/construir/construir').then((m) => m.Construir),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Panel · TextilClean',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'perfil',
        title: 'Mi perfil · TextilClean',
        loadComponent: () =>
          import('./features/auth/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'clientes',
        title: 'Clientes · TextilClean',
        loadComponent: () =>
          import('./features/clients/client-list/client-list').then(
            (m) => m.ClientList,
          ),
      },
      {
        path: 'tipos-producto',
        title: 'Tipos de producto · TextilClean',
        loadComponent: () =>
          import(
            './features/product-types/product-type-list/product-type-list'
          ).then((m) => m.ProductTypeList),
      },
      {
        path: 'productos',
        title: 'Productos · TextilClean',
        loadComponent: () =>
          import('./features/products/product-list/product-list').then(
            (m) => m.ProductList,
          ),
      },
      {
        path: 'ventas',
        title: 'Ventas · TextilClean',
        loadComponent: () =>
          import('./features/sales/sale-list/sale-list').then(
            (m) => m.SaleList,
          ),
      },
      {
        path: 'ventas/nueva',
        title: 'Nueva venta · TextilClean',
        loadComponent: () =>
          import('./features/sales/sale-form/sale-form').then(
            (m) => m.SaleForm,
          ),
      },
      {
        path: 'detalle-ventas',
        title: 'Detalle de ventas · TextilClean',
        loadComponent: () =>
          import(
            './features/product-sales/product-sale-list/product-sale-list'
          ).then((m) => m.ProductSaleList),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
