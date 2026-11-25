import { Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

/**
 * Barra superior. No conoce el estado del menú: avisa al Shell con
 * `menuRequested`. ISS-09 agrega el menú de usuario.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-header',
  imports: [ButtonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly menuRequested = output<void>();
}
