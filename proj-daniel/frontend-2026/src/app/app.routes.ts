import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { authOnlyGuard } from './core/guards/auth-only-guard';
import { guestGuard } from './core/guards/guest-guard';
import { permissionGuard } from './core/guards/permission-guard';

/**
 * Rutas de TextilClean. Las pantallas viven dentro del Shell, se cargan de forma
 * diferida y declaran su permiso (`data.permission`) para `permissionGuard`.
 *
 *  - authGuard: ¿hay sesión?          → si no, /login?returnUrl=…
 *  - permissionGuard: ¿tu rol puede?  → si no, /forbidden?permission=…
 *  - guestGuard: /login solo sin sesión.
 */
export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · TextilClean',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'forbidden',
    title: 'Acceso denegado · TextilClean',
    loadComponent: () => import('./features/auth/forbidden/forbidden').then((m) => m.Forbidden),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'panel' },
      {
        path: 'panel',
        title: 'Panel · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/ordenes' },
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'perfil',
        title: 'Mi perfil · TextilClean',
        canActivate: [authOnlyGuard],
        loadComponent: () => import('./features/auth/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'clientes',
        title: 'Clientes · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/clientes' },
        loadComponent: () =>
          import('./features/customers/customer-list/customer-list').then((m) => m.CustomerList),
      },
      {
        path: 'tipos-prenda',
        title: 'Tipos de prenda · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/tipos-prenda' },
        loadComponent: () =>
          import('./features/garment-types/garment-type-list/garment-type-list').then(
            (m) => m.GarmentTypeList,
          ),
      },
      {
        path: 'servicios',
        title: 'Servicios · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/servicios' },
        loadComponent: () =>
          import('./features/laundry-services/laundry-service-list/laundry-service-list').then(
            (m) => m.LaundryServiceList,
          ),
      },
      {
        path: 'ordenes',
        title: 'Órdenes de servicio · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/ordenes' },
        loadComponent: () =>
          import('./features/service-orders/service-order-list/service-order-list').then(
            (m) => m.ServiceOrderList,
          ),
      },
      {
        path: 'ordenes/nueva',
        title: 'Nueva orden · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'POST /api/ordenes' },
        loadComponent: () =>
          import('./features/service-orders/service-order-form/service-order-form').then(
            (m) => m.ServiceOrderForm,
          ),
      },
      {
        path: 'detalle-ordenes',
        title: 'Detalle de órdenes · TextilClean',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/detalle-ordenes' },
        loadComponent: () =>
          import('./features/service-order-items/service-order-item-list/service-order-item-list').then(
            (m) => m.ServiceOrderItemList,
          ),
      },
      // --- Administración RBAC (solo con auth activa) ---
      {
        path: 'admin/usuarios',
        title: 'Usuarios · TextilClean',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/usuarios' },
        loadComponent: () =>
          import('./features/admin/users/user-list/user-list').then((m) => m.UserList),
      },
      {
        path: 'admin/roles',
        title: 'Roles · TextilClean',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/roles' },
        loadComponent: () =>
          import('./features/admin/roles/role-list/role-list').then((m) => m.RoleList),
      },
      {
        path: 'admin/recursos',
        title: 'Recursos · TextilClean',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/recursos' },
        loadComponent: () =>
          import('./features/admin/resources/resource-list/resource-list').then(
            (m) => m.ResourceList,
          ),
      },
      {
        path: 'admin/asignaciones',
        title: 'Asignaciones de rol · TextilClean',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/asignaciones-rol' },
        loadComponent: () =>
          import('./features/admin/role-users/role-user-list/role-user-list').then(
            (m) => m.RoleUserList,
          ),
      },
      {
        path: 'admin/permisos',
        title: 'Concesiones · TextilClean',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/concesiones-rol' },
        loadComponent: () =>
          import('./features/admin/resource-roles/resource-role-list/resource-role-list').then(
            (m) => m.ResourceRoleList,
          ),
      },
      { path: '**', redirectTo: 'panel' },
    ],
  },
];
