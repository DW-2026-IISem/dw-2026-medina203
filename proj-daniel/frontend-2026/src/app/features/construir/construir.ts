import { Component } from '@angular/core';
import { Ejemplo } from '../../demo/ejemplo/ejemplo';

/**
 * Pantalla de prototipo heredada de ISS-01.
 * Vive dentro del Shell para comprobar que el layout no rompe los componentes.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-construir',
  imports: [Ejemplo],
  templateUrl: './construir.html',
  styleUrl: './construir.css',
})
export class Construir {}
