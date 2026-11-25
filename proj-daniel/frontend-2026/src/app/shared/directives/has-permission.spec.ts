import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionStore } from '../../core/services/session-store';
import { HasPermission } from './has-permission';

@Component({
  imports: [HasPermission],
  template: `
    <button *appHasPermission="'POST /api/clientes'" id="crear">Crear</button>
    <button *appHasPermission="'DELETE /api/clientes/:id'" id="borrar">Borrar</button>
  `,
})
class Host {}

describe('HasPermission', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('should render only the granted actions and react to permission changes', async () => {
    const fixture = TestBed.createComponent(Host);
    const session = TestBed.inject(SessionStore);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#crear')).toBeNull();

    session.setAccess({
      user: null as never,
      permissions: [
        {
          resource_id: 1,
          method: 'POST',
          path: '/api/clientes',
          description: null,
          role_id: 1,
          role_name: 'X',
        },
      ],
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#crear')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#borrar')).toBeNull();

    session.clear();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#crear')).toBeNull();
  });
});
