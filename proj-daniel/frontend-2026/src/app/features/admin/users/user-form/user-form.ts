import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { Status } from '../../../../core/models/api.model';
import { UserPayload } from '../../../../core/models/admin.model';
import { User } from '../../../../core/models/user.model';

/**
 * Formulario de usuario del personal. En edición no se muestran contraseña ni
 * estado: la contraseña cambia con su propio endpoint y el estado con la baja lógica.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-user-form',
  imports: [
    ButtonModule,
    InputTextModule,
    MessageModule,
    PasswordModule,
    ReactiveFormsModule,
    SelectModule,
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
})
export class UserForm {
  readonly user = input<User | null>(null);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<UserPayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    full_name: ['', [Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    avatar: [''],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.user();
      this.resetKey();

      this.form.reset({
        username: current?.username ?? '',
        full_name: current?.full_name ?? '',
        email: current?.email ?? '',
        password: '',
        avatar: current?.avatar ?? '',
        status: current?.status ?? 'active',
      });

      const password = this.form.controls.password;
      const status = this.form.controls.status;

      if (current) {
        password.clearValidators();
        password.disable();
        status.disable();
      } else {
        password.setValidators([Validators.required, Validators.minLength(8)]);
        password.enable();
        status.enable();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();

    const payload: UserPayload = {
      username: value.username.trim().toLowerCase(),
      full_name: value.full_name.trim() || null,
      email: value.email.trim().toLowerCase(),
      avatar: value.avatar.trim() || null,
    };

    if (!this.user()) {
      payload.status = value.status;
      payload.password = value.password;
    }

    this.saved.emit(payload);
  }
}
