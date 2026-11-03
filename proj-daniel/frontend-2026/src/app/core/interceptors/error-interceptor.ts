import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

/**
 * Traduce los fallos que el interceptor de auth no gestiona (401 ya resuelto).
 * Muestra toast para 403/500/offline. Los componentes pueden seguir manejando
 * el error por su cuenta (por ejemplo, `p-message` para el fallo de carga).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(MessageService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          notify.add({
            severity: 'error',
            summary: 'Sin conexión',
            detail: 'No se pudo contactar al servidor.',
          });
        } else if (error.status === 403) {
          notify.add({
            severity: 'warn',
            summary: 'Permiso insuficiente',
            detail: 'La operación no está permitida para tu rol.',
          });
        } else if (error.status >= 500) {
          notify.add({
            severity: 'error',
            summary: 'Error del servidor',
            detail: 'La operación no pudo completarse.',
          });
        }
      }
      return throwError(() => error);
    }),
  );
};
