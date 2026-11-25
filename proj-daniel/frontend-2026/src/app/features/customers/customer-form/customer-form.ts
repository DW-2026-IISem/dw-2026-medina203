import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Status } from '../../../core/models/api.model';
import { Customer, CustomerCreatePayload } from '../../../core/models/customer.model';

/** NIT colombiano: 5 a 15 dígitos y dígito de verificación opcional (900123456-7). */
export const NIT_PATTERN = /^[0-9]{5,15}(-[0-9])?$/;

/**
 * Formulario de empresa cliente, reutilizado para crear y editar.
 *
 * No llama a la API: recibe `customer` (o `null` para crear) y emite el payload
 * con `saved`. El padre decide entre POST y PATCH y controla el diálogo.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-customer-form',
  imports: [
    ButtonModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.css',
})
export class CustomerForm {
  /** Cliente a editar; `null` = modo creación. */
  readonly customer = input<Customer | null>(null);
  /** Cambia cada vez que el padre abre el diálogo, para limpiar el formulario. */
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<CustomerCreatePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    business_name: ['', [Validators.required, Validators.maxLength(150)]],
    tax_id: ['', [Validators.required, Validators.pattern(NIT_PATTERN)]],
    contact_name: ['', [Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.maxLength(200)]],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.customer();
      this.resetKey();

      this.form.reset({
        business_name: current?.business_name ?? '',
        tax_id: current?.tax_id ?? '',
        contact_name: current?.contact_name ?? '',
        phone: current?.phone ?? '',
        email: current?.email ?? '',
        address: current?.address ?? '',
        status: current?.status ?? 'active',
      });

      // El estado de un cliente existente solo cambia con la baja lógica.
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
    const payload: CustomerCreatePayload = {
      business_name: value.business_name.trim(),
      tax_id: value.tax_id.trim(),
      contact_name: value.contact_name.trim() || null,
      phone: value.phone.trim(),
      email: value.email.trim().toLowerCase(),
      address: value.address.trim() || null,
    };

    this.saved.emit(this.customer() ? payload : { ...payload, status: value.status });
  }
}
