import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'clientes' },
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
        path: 'construir',
        title: 'Prototipo · TextilClean',
        loadComponent: () =>
          import('./features/construir/construir').then((m) => m.Construir),
      },
      { path: '**', redirectTo: 'clientes' },
    ],
  },
];
