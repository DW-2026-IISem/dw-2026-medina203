import { Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

/**
 * Barra superior del layout. No conoce el estado del menú: solo avisa con
 * `menuRequested` y el Shell decide si colapsa el Aside o abre el Drawer.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-header',
  imports: [RouterLink, ButtonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly menuRequested = output<void>();
}
