import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../services/session-store';

/**
 * Pantallas que requieren auth real (perfil, /admin/*).
 * En modo laboratorio (authEnabled = false) se redirige al dashboard.
 */
export const authOnlyGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);

  if (session.authEnabled) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
