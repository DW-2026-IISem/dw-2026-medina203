import { TestBed } from '@angular/core/testing';
import { Ejemplo } from './ejemplo';

describe('Ejemplo', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Ejemplo] }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Ejemplo);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the initial product', async () => {
    const fixture = TestBed.createComponent(Ejemplo);
    await fixture.whenStable();
    const t = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(t).toContain('Café molido 500 g');
    expect(t).toContain('18000');
  });

  it('should add 1000 to the price when clicking +1000', async () => {
    const fixture = TestBed.createComponent(Ejemplo);
    await fixture.whenStable();
    const boton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (b: HTMLButtonElement) => b.textContent?.includes('+1000'),
    ) as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('19000');
  });

  it('should reset to the initial object', async () => {
    const fixture = TestBed.createComponent(Ejemplo);
    await fixture.whenStable();
    const botonMas = [...fixture.nativeElement.querySelectorAll('button')].find(
      (b: HTMLButtonElement) => b.textContent?.includes('+1000'),
    ) as HTMLButtonElement;
    botonMas.click();
    fixture.detectChanges();

    const botonReiniciar = [...fixture.nativeElement.querySelectorAll('button')].find(
      (b: HTMLButtonElement) => b.textContent?.includes('Reiniciar'),
    ) as HTMLButtonElement;
    botonReiniciar.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('18000');
  });
});
