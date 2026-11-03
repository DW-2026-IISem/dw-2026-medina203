import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { watchMediaQuery } from '../../core/utils/media-query';
import { Aside } from '../aside/aside';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';

/**
 * Layout único de la aplicación: Header + Aside + router-outlet + Footer.
 *
 * El botón del Header colapsa el Aside en escritorio (>= 1024 px) y abre el
 * Drawer en móvil.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-shell',
  imports: [
    Aside,
    ConfirmDialogModule,
    DrawerModule,
    Footer,
    Header,
    RouterOutlet,
    ToastModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  protected readonly isDesktop = watchMediaQuery('(min-width: 1024px)');

  readonly sidebarCollapsed = signal(false);
  readonly mobileOpen = signal(false);

  readonly items: MenuItem[] = [
    { label: 'Panel', icon: 'pi pi-chart-line', routerLink: '/dashboard' },
    { label: 'Clientes', icon: 'pi pi-users', routerLink: '/clientes' },
    {
      label: 'Tipos de producto',
      icon: 'pi pi-tags',
      routerLink: '/tipos-producto',
    },
    { label: 'Productos', icon: 'pi pi-box', routerLink: '/productos' },
    { label: 'Ventas', icon: 'pi pi-shopping-cart', routerLink: '/ventas' },
    {
      label: 'Detalle de ventas',
      icon: 'pi pi-list',
      routerLink: '/detalle-ventas',
    },
    { label: 'Prototipo', icon: 'pi pi-desktop', routerLink: '/construir' },
  ];

  protected toggleMenu(): void {
    if (this.isDesktop()) {
      this.sidebarCollapsed.update((collapsed) => !collapsed);
      return;
    }
    this.mobileOpen.set(true);
  }

  protected closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
