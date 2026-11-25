import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth';
import { toApiMessage } from '../../../core/utils/api-error';

/**
 * Inicio de sesión (`POST /api/sesion/login`, luego perfil + permisos).
 * Tras entrar vuelve a la URL pedida (`returnUrl`) o al panel.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-login',
  imports: [ButtonModule, InputTextModule, MessageModule, PasswordModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Las credenciales de laboratorio solo se muestran fuera de producción. */
  protected readonly production = environment.production;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** El interceptor añade `?reason=expired` cuando el refresh falla. */
  readonly expired = this.route.snapshot.queryParamMap.get('reason') === 'expired';

  readonly form = this.fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { identifier, password } = this.form.getRawValue();
    this.auth.login({ identifier, password }).subscribe({
      next: () => {
        const requested = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/panel';
        const returnUrl =
          requested.startsWith('/') && !requested.startsWith('/login') ? requested : '/panel';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(toApiMessage(error));
      },
    });
  }
}
