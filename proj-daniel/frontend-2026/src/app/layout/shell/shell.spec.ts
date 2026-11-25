import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Shell } from './shell';

describe('Shell (ISS-02)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([]), MessageService, ConfirmationService],
    }).compileComponents();
  });

  it('arma el menú a partir de NAV', () => {
    const shell = TestBed.createComponent(Shell).componentInstance;
    const labels = shell.navGroups().flatMap((g) => g.items?.map((i) => i.label) ?? []);
    expect(labels).toContain('Inicio');
  });

  it('en móvil (jsdom) el botón del header abre el drawer', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('app-header button')
      ?.click();
    expect(fixture.componentInstance.mobileOpen()).toBe(true);
  });
});
