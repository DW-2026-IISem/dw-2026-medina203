import { Component, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

/**
 * Componente raíz (`<app-root>`).
 *
 * En ISS-01 solo comprueba que Angular, PrimeNG (Aura) y Tailwind están bien
 * integrados. ISS-02 lo reduce a un `<router-outlet />` y el layout pasa al Shell.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-root',
  imports: [ButtonModule, TagModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = 'TextilClean';
  protected readonly clicks = signal(0);
}
