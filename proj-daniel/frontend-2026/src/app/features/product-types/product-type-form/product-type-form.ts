import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Status } from '../../../core/models/api.model';
import { ProductType, ProductTypePayload } from '../../../core/models/product-type.model';

@Component({
  host: { class: 'block' },
  selector: 'app-product-type-form',
  imports: [
    MessageModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './product-type-form.html',
  styleUrl: './product-type-form.css',
})
export class ProductTypeForm {
  readonly productType = input<ProductType | null>(null);

  /** Se incrementa al reabrir «Nuevo tipo»; obliga al effect a correr. */
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<ProductTypePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.productType();
      this.resetKey(); // reabrir el diálogo debe vaciar el formulario

      this.form.reset({
        name: current?.name ?? '',
        description: current?.description ?? '',
        status: current?.status ?? 'active',
      });

      // PATCH/PUT no aceptan `status`: el estado solo cambia con /deactivate.
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
    this.saved.emit({
      name: value.name.trim(),
      description: value.description.trim() || null,
      ...(this.productType() ? {} : { status: value.status }),
    });
  }
}
