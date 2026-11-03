import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Shell } from './shell';

type MediaStub = {
  matches: boolean;
  media: string;
  addEventListener: () => void;
  removeEventListener: () => void;
};

/** jsdom no trae matchMedia: lo sustituimos para forzar escritorio o móvil. */
function stubMatchMedia(matches: boolean): void {
  const stub = (query: string): MediaStub => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  (window as unknown as { matchMedia: unknown }).matchMedia = stub;
}

describe('Shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([]), MessageService, ConfirmationService],
    }).compileComponents();
  });

  afterEach(() => {
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  it('should compose header, aside and footer exactly once on desktop', async () => {
    stubMatchMedia(true);
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelectorAll('app-header').length).toBe(1);
    expect(el.querySelectorAll('app-footer').length).toBe(1);
    expect(el.querySelectorAll('app-aside').length).toBe(1);
  });

  it('should keep a single aside when the drawer opens on mobile', async () => {
    stubMatchMedia(false);
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelectorAll('app-aside').length).toBe(0);

    const boton = el.querySelector(
      'app-header button[aria-label="Mostrar u ocultar el menú"]',
    ) as HTMLButtonElement;
    boton.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.mobileOpen()).toBe(true);
    expect(el.querySelectorAll('app-aside').length).toBe(1);
  });

  it('should collapse the sidebar instead of opening the drawer on desktop', async () => {
    stubMatchMedia(true);
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();

    expect(fixture.componentInstance.sidebarCollapsed()).toBe(false);

    const boton = fixture.nativeElement.querySelector(
      'app-header button[aria-label="Mostrar u ocultar el menú"]',
    ) as HTMLButtonElement;
    boton.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.sidebarCollapsed()).toBe(true);
    expect(fixture.componentInstance.mobileOpen()).toBe(false);
  });
});
