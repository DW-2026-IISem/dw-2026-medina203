import { TestBed } from '@angular/core/testing';
import { watchMediaQuery } from './media-query';

describe('watchMediaQuery', () => {
  it('should return false when matchMedia is not available (jsdom)', () => {
    const matches = TestBed.runInInjectionContext(() =>
      watchMediaQuery('(min-width: 1024px)'),
    );
    expect(matches()).toBe(false);
  });

  it('should follow the media query changes', () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const original = window.matchMedia;

    window.matchMedia = ((query: string) =>
      ({
        matches: true,
        media: query,
        addEventListener: (_event: string, cb: (event: MediaQueryListEvent) => void) => {
          listener = cb;
        },
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList) as typeof window.matchMedia;

    const matches = TestBed.runInInjectionContext(() =>
      watchMediaQuery('(min-width: 1024px)'),
    );
    expect(matches()).toBe(true);

    listener?.({ matches: false } as MediaQueryListEvent);
    expect(matches()).toBe(false);

    window.matchMedia = original;
  });
});
