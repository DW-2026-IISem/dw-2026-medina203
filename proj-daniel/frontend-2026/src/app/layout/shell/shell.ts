import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification';
import { SessionStore } from '../../core/services/session-store';
import { toApiMessage } from '../../core/utils/api-error';
import { watchMediaQuery } from '../../core/utils/media-query';
import { Aside } from '../aside/aside';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import { NAV } from './nav.config';

/**
 * Layout único: Header + Aside + router-outlet + Footer.
 *
 * - El botón del Header colapsa el Aside en escritorio (>= 1024 px) y abre el
 *   Drawer en móvil.
 * - `navGroups()` filtra `NAV` con los permisos efectivos: si cambian (por
 *   ejemplo, al recargar permisos), el menú cambia sin recargar la página.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-shell',
  imports: [Aside, ConfirmDialogModule, DrawerModule, Footer, Header, RouterOutlet, ToastModule],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  protected readonly session = inject(SessionStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  protected readonly isDesktop = watchMediaQuery('(min-width: 1024px)');

  readonly sidebarCollapsed = signal(false);
  readonly mobileOpen = signal(false);

  readonly navGroups = computed<MenuItem[]>(() =>
    NAV.filter((group) => !group.authOnly || this.session.authEnabled)
      .map((group) => ({
        label: group.label,
        items: group.items
          .filter((item) => !item.permission || this.session.canPermission(item.permission))
          .map<MenuItem>((item) => ({
            label: item.label,
            icon: item.icon,
            routerLink: item.routerLink,
            routerLinkActiveOptions: { exact: item.exact ?? false },
          })),
      }))
      .filter((group) => (group.items?.length ?? 0) > 0),
  );

  readonly displayName = computed(() => this.session.displayName());

  readonly roleLabel = computed(() => this.session.roleNames().join(', ') || 'Sin rol');

  /** Iniciales del nombre completo (o del username si no hay nombre). */
  readonly initials = computed(() => {
    const name = this.displayName();
    if (!name) return 'IN';
    const parts = name.split(/[._\s-]+/).filter(Boolean);
    const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
    return letters.toUpperCase();
  });

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

  protected goToProfile(): void {
    void this.router.navigate(['/perfil']);
  }

  protected reloadPermissions(): void {
    this.auth.me().subscribe({
      next: () => this.notify.success('Permisos actualizados'),
      error: (error: unknown) =>
        this.notify.error('No se pudieron actualizar', toApiMessage(error)),
    });
  }

  protected onLogout(): void {
    this.closeMobile();
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
    });
  }
}
