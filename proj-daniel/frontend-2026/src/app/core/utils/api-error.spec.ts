import { HttpErrorResponse } from '@angular/common/http';
import { toApiMessage } from './api-error';

describe('toApiMessage', () => {
  it('should explain status 0 as a backend that is down', () => {
    const error = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
    expect(toApiMessage(error)).toContain('No se pudo conectar con el backend');
  });

  it('should join error and detail from the Express body', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { error: 'Validation error', detail: 'name must be a string' },
    });
    expect(toApiMessage(error)).toBe('Validation error — name must be a string');
  });

  it('should keep an opaque 403 as Forbidden', () => {
    const error = new HttpErrorResponse({ status: 403, error: { error: 'Forbidden' } });
    expect(toApiMessage(error)).toBe('Forbidden');
  });

  it('should return a plain string body as is', () => {
    const error = new HttpErrorResponse({ status: 500, error: 'boom' });
    expect(toApiMessage(error)).toBe('boom');
  });

  it('should fall back to Error.message', () => {
    expect(toApiMessage(new Error('fallo'))).toBe('fallo');
  });
});
