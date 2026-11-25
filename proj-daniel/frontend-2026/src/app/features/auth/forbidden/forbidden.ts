import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

/** 403: la ruta exige un permiso que el rol del usuario no tiene. */
@Component({
  host: { class: 'block' },
  selector: 'app-forbidden',
  imports: [ButtonModule, RouterLink],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.css',
})
export class Forbidden {
  private readonly route = inject(ActivatedRoute);
  readonly permission = this.route.snapshot.queryParamMap.get('permission');
}
