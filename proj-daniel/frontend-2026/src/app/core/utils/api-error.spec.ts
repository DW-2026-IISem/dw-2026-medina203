import { HttpErrorResponse } from '@angular/common/http';
import { toApiMessage } from './api-error';

describe('toApiMessage', () => {
  it('explica el status 0 como backend caído', () => {
    const error = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
    expect(toApiMessage(error)).toContain('No se pudo conectar con el backend');
  });

  it('devuelve el error de negocio de Express', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { error: 'Delivered orders cannot be modified' },
    });
    expect(toApiMessage(error)).toBe('Delivered orders cannot be modified');
  });

  it('une error y detail cuando ambos llegan', () => {
    const error = new HttpErrorResponse({
      status: 500,
      error: { error: 'Internal server error', detail: 'boom' },
    });
    expect(toApiMessage(error)).toBe('Internal server error — boom');
  });

  it('devuelve tal cual un cuerpo de texto', () => {
    expect(toApiMessage(new HttpErrorResponse({ status: 500, error: 'boom' }))).toBe('boom');
  });

  it('usa Error.message como respaldo', () => {
    expect(toApiMessage(new Error('fallo'))).toBe('fallo');
  });
});
