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
      { path: '**', redirectTo: 'inicio' },
    ],
  },
];
