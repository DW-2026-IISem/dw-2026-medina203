import { DestroyRef, Signal, inject, signal } from '@angular/core';

/**
 * Devuelve un signal que sigue el resultado de una media query.
 *
 * Debe llamarse en un contexto de inyección (campo de un componente o
 * servicio). En jsdom (pruebas) no existe `window.matchMedia`: el signal queda
 * en `false` y las pruebas ejercitan la rama móvil.
 */
export function watchMediaQuery(query: string): Signal<boolean> {
  const media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query)
      : null;

  const matches = signal(media?.matches ?? false);

  if (media) {
    const listener = (event: MediaQueryListEvent): void => matches.set(event.matches);
    media.addEventListener('change', listener);
    inject(DestroyRef).onDestroy(() => media.removeEventListener('change', listener));
  }

  return matches.asReadonly();
}
