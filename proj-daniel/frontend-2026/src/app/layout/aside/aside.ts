import { Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';

/**
 * Menú lateral reutilizable: lo usan el Aside de escritorio y el Drawer móvil.
 *
 * Acepta una lista plana (`MenuItem` con `routerLink`) o grupos
 * (`MenuItem` con `items`), que es lo que construye `Shell.navGroups()`.
 */
@Component({
  host: { class: 'block h-full' },
  selector: 'app-aside',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  templateUrl: './aside.html',
  styleUrl: './aside.css',
})
export class Aside {
  readonly items = input<MenuItem[]>([]);
  readonly showSession = input(false);
  readonly username = input('');
  readonly roleLabel = input('');
  readonly permissionCount = input(0);

  readonly navigated = output<void>();
  readonly logoutRequested = output<void>();
}
