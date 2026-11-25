import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { GarmentType, GarmentTypeCreatePayload } from '../../../core/models/garment-type.model';

/** Formulario de tipo de prenda (crear y editar). No llama a la API: emite `saved`. */
@Component({
  host: { class: 'block' },
  selector: 'app-garment-type-form',
  imports: [ButtonModule, InputTextModule, MessageModule, ReactiveFormsModule, TextareaModule],
  templateUrl: './garment-type-form.html',
  styleUrl: './garment-type-form.css',
})
export class GarmentTypeForm {
  readonly garmentType = input<GarmentType | null>(null);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<GarmentTypeCreatePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.maxLength(255)]],
  });

  constructor() {
    effect(() => {
      const current = this.garmentType();
      this.resetKey();
      this.form.reset({ name: current?.name ?? '', description: current?.description ?? '' });
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
    });
  }
}
