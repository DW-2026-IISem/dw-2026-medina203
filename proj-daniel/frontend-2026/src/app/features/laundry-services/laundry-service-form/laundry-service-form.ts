import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { GarmentType } from '../../../core/models/garment-type.model';
import {
  BILLING_UNITS,
  BillingUnit,
  LaundryService,
  LaundryServiceCreatePayload,
} from '../../../core/models/laundry-service.model';
import { toNumber } from '../../../core/utils/to-number';

/**
 * Formulario de servicio de lavandería.
 *
 * Relación con tipos de prenda: el `p-select` usa `optionValue="id"`, así el
 * control guarda el `garment_type_id` que espera el backend (no el objeto).
 */
@Component({
  host: { class: 'block' },
  selector: 'app-laundry-service-form',
  imports: [
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './laundry-service-form.html',
  styleUrl: './laundry-service-form.css',
})
export class LaundryServiceForm {
  readonly service = input<LaundryService | null>(null);
  /** Tipos de prenda activos para el select. */
  readonly garmentTypes = input<GarmentType[]>([]);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<LaundryServiceCreatePayload>();
  readonly cancelled = output<void>();

  readonly billingUnits = BILLING_UNITS;

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(255)]],
    garment_type_id: this.fb.control<number | null>(null, Validators.required),
    billing_unit: ['kg' as BillingUnit, [Validators.required]],
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    estimated_hours: [24, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    effect(() => {
      const current = this.service();
      this.resetKey();
      this.form.reset({
        name: current?.name ?? '',
        description: current?.description ?? '',
        garment_type_id: current?.garment_type_id ?? null,
        billing_unit: current?.billing_unit ?? 'kg',
        price: current ? toNumber(current.price) : null,
        estimated_hours: current?.estimated_hours ?? 24,
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({
      name: value.name.trim(),
      description: value.description.trim() || null,
      garment_type_id: value.garment_type_id as number,
      billing_unit: value.billing_unit,
      price: Number(value.price),
      estimated_hours: Number(value.estimated_hours),
    });
  }
}
