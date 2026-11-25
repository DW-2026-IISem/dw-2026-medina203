import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TagModule } from 'primeng/tag';

/**
 * Barra superior. No conoce el estado del menú ni la sesión: recibe los datos
 * del Shell (nombre, iniciales, roles) y avisa con outputs (menú, perfil,
 * recargar permisos, cerrar sesión).
 */
@Component({
  host: { class: 'block' },
  selector: 'app-header',
  imports: [AvatarModule, ButtonModule, MenuModule, RouterLink, TagModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly showSession = input(false);
  readonly username = input('');
  readonly initials = input('');
  readonly roleLabel = input('');

  readonly menuRequested = output<void>();
  readonly profileRequested = output<void>();
  readonly reloadPermissionsRequested = output<void>();
  readonly logoutRequested = output<void>();

  /** Ojo: la referencia de plantilla se llama #userMenuPanel, no #userMenu. */
  readonly userMenu = computed<MenuItem[]>(() => [
    { label: this.username() || 'Sesión', disabled: true },
    { separator: true },
    {
      label: 'Mi perfil',
      icon: 'pi pi-user',
      command: () => this.profileRequested.emit(),
    },
    {
      label: 'Actualizar permisos',
      icon: 'pi pi-refresh',
      command: () => this.reloadPermissionsRequested.emit(),
    },
    {
      label: 'Cerrar sesión',
      icon: 'pi pi-sign-out',
      command: () => this.logoutRequested.emit(),
    },
  ]);
}
