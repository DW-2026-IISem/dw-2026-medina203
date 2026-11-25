import { Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';

/**
 * Menú lateral reutilizable: lo usan el Aside de escritorio y el Drawer móvil.
 * Acepta grupos (`MenuItem` con `items`) o elementos sueltos.
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
  readonly navigated = output<void>();
}
