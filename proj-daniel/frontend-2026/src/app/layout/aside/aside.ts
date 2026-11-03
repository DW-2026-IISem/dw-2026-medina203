import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';

/** Menú lateral reutilizable: lo usan el Aside de escritorio y el Drawer móvil. */
@Component({
  host: { class: 'block h-full' },
  selector: 'app-aside',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './aside.html',
  styleUrl: './aside.css',
})
export class Aside {
  readonly items = input<MenuItem[]>([]);
  readonly navigated = output<void>();
}
