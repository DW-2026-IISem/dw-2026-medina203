import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Status } from '../../../../core/models/api.model';
import { ResourcePayload } from '../../../../core/models/admin.model';
import { HttpMethod, Resource } from '../../../../core/models/resource.model';
import { HTTP_METHODS } from '../../../../core/utils/http-method';

@Component({
  host: { class: 'block' },
  selector: 'app-resource-form',
  imports: [ButtonModule, InputTextModule, MessageModule, ReactiveFormsModule, SelectModule],
  templateUrl: './resource-form.html',
  styleUrl: './resource-form.css',
})
export class ResourceForm {
  readonly resource = input<Resource | null>(null);
  readonly resetKey = input(0);
  readonly saving = input(false);
  readonly saved = output<ResourcePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  readonly methods = HTTP_METHODS;

  readonly form = this.fb.group({
    path: ['', [Validators.required, Validators.pattern(/^\/.*$/)]],
    method: ['GET' as HttpMethod, [Validators.required]],
    description: [''],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.resource();
      this.resetKey();
      this.form.reset({
        path: current?.path ?? '',
        method: current?.method ?? 'GET',
        description: current?.description ?? '',
        status: current?.status ?? 'active',
      });
      if (current) this.form.controls.status.disable();
      else this.form.controls.status.enable();
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saved.emit({
      path: v.path.trim(),
      method: v.method,
      description: v.description.trim() || null,
      ...(this.resource() ? {} : { status: v.status }),
    });
  }
}
