import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { authOnlyGuard } from './core/guards/auth-only-guard';
import { guestGuard } from './core/guards/guest-guard';
import { permissionGuard } from './core/guards/permission-guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · TextilClean',
    canActivate: [guestGuard],
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Panel · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/ventas' },
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'perfil',
        title: 'Mi perfil · TextilClean',
        canActivate: [authOnlyGuard],
        loadComponent: () =>
          import('./features/auth/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'clientes',
        title: 'Clientes · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/clientes' },
        loadComponent: () =>
          import('./features/clients/client-list/client-list').then(
            (m) => m.ClientList,
          ),
      },
      {
        path: 'tipos-producto',
        title: 'Tipos de producto · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/tipos-producto' },
        loadComponent: () =>
          import(
            './features/product-types/product-type-list/product-type-list'
          ).then((m) => m.ProductTypeList),
      },
      {
        path: 'productos',
        title: 'Productos · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/productos' },
        loadComponent: () =>
          import('./features/products/product-list/product-list').then(
            (m) => m.ProductList,
          ),
      },
      {
        path: 'ventas',
        title: 'Ventas · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/ventas' },
        loadComponent: () =>
          import('./features/sales/sale-list/sale-list').then(
            (m) => m.SaleList,
          ),
      },
      {
        path: 'ventas/nueva',
        title: 'Nueva venta · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'POST /api/ventas' },
        loadComponent: () =>
          import('./features/sales/sale-form/sale-form').then(
            (m) => m.SaleForm,
          ),
      },
      {
        path: 'detalle-ventas',
        title: 'Detalle de ventas · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/detalle-ventas' },
        loadComponent: () =>
          import(
            './features/product-sales/product-sale-list/product-sale-list'
          ).then((m) => m.ProductSaleList),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
