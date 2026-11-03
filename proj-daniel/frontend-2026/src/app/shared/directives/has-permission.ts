import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { SessionStore } from '../../core/services/session-store';

/**
 * Directiva estructural: muestra el contenido si el usuario tiene el permiso.
 *
 * Uso:
 *   <ng-container *appHasPermission="'POST /api/clientes'">…</ng-container>
 *
 * Es UX, no seguridad: el backend vuelve a validar cada petición.
 */
@Directive({
  selector: '[appHasPermission]',
})
export class HasPermission {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly session = inject(SessionStore);

  readonly appHasPermission = input.required<string>();

  constructor() {
    effect(() => {
      const permission = this.appHasPermission();
      const allowed = this.session.canPermission(permission);

      if (allowed) {
        if (!this.viewContainer.length) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        }
      } else {
        this.viewContainer.clear();
      }
    });
  }
}
