import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App (ISS-01)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('se crea', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el nombre del sistema y reacciona al botón de PrimeNG', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('h1')?.textContent).toContain('TextilClean');

    host.querySelector('button')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.textContent).toContain('1 clics');
  });
});
