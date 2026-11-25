import { Component } from '@angular/core';
import { PageHeader } from '../../shared/ui/page-header/page-header';

/** Página de inicio provisional. ISS-07 la reemplaza por el panel (dashboard). */
@Component({
  host: { class: 'block' },
  selector: 'app-home',
  imports: [PageHeader],
  template: `
    <app-page-header
      title="Bienvenido a TextilClean"
      subtitle="Gestión de órdenes de lavado industrial para hoteles, clínicas y restaurantes."
    />
    <div class="grid gap-4 sm:grid-cols-3">
      @for (step of steps; track step.title) {
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <i [class]="step.icon + ' text-xl text-teal-600'"></i>
          <p class="mt-2 font-medium text-slate-800">{{ step.title }}</p>
          <p class="text-sm text-slate-500">{{ step.text }}</p>
        </div>
      }
    </div>
  `,
})
export class Home {
  protected readonly steps = [
    { icon: 'pi pi-building', title: 'Clientes', text: 'Empresas que entregan su ropa.' },
    { icon: 'pi pi-tags', title: 'Servicios', text: 'Lavado por kg o por prenda.' },
    { icon: 'pi pi-inbox', title: 'Órdenes', text: 'Recibida → en proceso → lista → entregada.' },
  ];
}
