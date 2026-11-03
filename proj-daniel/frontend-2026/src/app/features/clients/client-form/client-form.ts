import { Component, effect, inject, input, output } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Status } from '../../../core/models/api.model';
import { Client, ClientPayload } from '../../../core/models/client.model';

/**
 * Formulario de cliente, reutilizado para crear y editar.
 *
 * No llama a la API: recibe `client` (o `null` para crear) y emite el payload
 * con `saved`. El padre decide entre `POST` y `PATCH` y controla el diálogo, así
 * que este componente sirve igual dentro de un Dialog que en una página.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-client-form',
  imports: [
    MessageModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './client-form.html',
  styleUrl: './client-form.css',
})
export class ClientForm {
  /** Cliente a editar. `null` deja el formulario en modo creación. */
  readonly client = input<Client | null>(null);

  /**
   * Cambia cada vez que el padre abre el diálogo.
   *
   * Sin esto, reabrir «Nuevo cliente» tras cancelar conservaría lo escrito:
   * `client` sigue siendo `null`, así que el `effect()` no volvería a correr.
   */
  readonly resetKey = input(0);

  /** Petición en curso: deshabilita el botón y muestra su spinner. */
  readonly saving = input(false);

  readonly saved = output<ClientPayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    address: [''],
    phone: [''],
    email: ['', [Validators.email]],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.client();
      this.resetKey();

      this.form.reset({
        name: current?.name ?? '',
        address: current?.address ?? '',
        phone: current?.phone ?? '',
        email: current?.email ?? '',
        status: current?.status ?? 'active',
      });

      if (current) {
        this.form.controls.status.disable();
      } else {
        this.form.controls.status.enable();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: ClientPayload = {
      name: value.name.trim(),
      address: value.address.trim() || null,
      phone: value.phone.trim() || null,
      email: value.email.trim() || null,
    };

    this.saved.emit(this.client() ? payload : { ...payload, status: value.status });
  }
}
