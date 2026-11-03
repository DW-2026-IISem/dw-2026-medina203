import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  host: { class: 'block' },
  selector: 'app-forbidden',
  imports: [ButtonModule, RouterLink],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.css',
})
export class Forbidden {}
