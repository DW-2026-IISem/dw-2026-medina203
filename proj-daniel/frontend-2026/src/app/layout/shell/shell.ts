import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { watchMediaQuery } from '../../core/utils/media-query';
import { Aside } from '../aside/aside';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import { NAV } from './nav.config';

/**
 * Layout único: Header + Aside + router-outlet + Footer.
 *
 * El botón del Header colapsa el Aside en escritorio (>= 1024 px) y abre un
 * Drawer en móvil. Toast y ConfirmDialog viven aquí una sola vez.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-shell',
  imports: [Aside, ConfirmDialogModule, DrawerModule, Footer, Header, RouterOutlet, ToastModule],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  protected readonly isDesktop = watchMediaQuery('(min-width: 1024px)');

  readonly sidebarCollapsed = signal(false);
  readonly mobileOpen = signal(false);

  readonly navGroups = computed<MenuItem[]>(() =>
    NAV.map((group) => ({
      label: group.label,
      items: group.items.map<MenuItem>((item) => ({
        label: item.label,
        icon: item.icon,
        routerLink: item.routerLink,
      })),
    })),
  );

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
