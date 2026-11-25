import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SessionStore } from '../../core/services/session-store';
import { Shell } from './shell';

function labels(shell: Shell): string[] {
  return shell.navGroups().flatMap((g) => g.items?.map((i) => i.label as string) ?? []);
}

describe('Shell (menú por rol)', () => {
  let session: SessionStore;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([]), provideHttpClient(), MessageService, ConfirmationService],
    }).compileComponents();
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => localStorage.clear());

  function grant(...ops: string[]): void {
    session.setAccess({
      user: {
        id: 2,
        username: 'operador',
        full_name: 'Operario de planta',
        email: 'o@x',
        avatar: null,
        status: 'active',
        roles: ['OPERATOR'],
      },
      permissions: ops.map((op, i) => {
        const [method, path] = op.split(' ');
        return {
          resource_id: i,
          method: method as 'GET',
          path,
          description: null,
          role_id: 2,
          role_name: 'OPERATOR',
        };
      }),
    });
  }

  it('sin permisos solo queda «Mi perfil»', () => {
    grant();
    const shell = TestBed.createComponent(Shell).componentInstance;
    expect(labels(shell)).toEqual(['Mi perfil']);
  });

  it('el operario ve órdenes y catálogos de consulta, no la seguridad', () => {
    grant('GET /api/ordenes', 'POST /api/ordenes', 'GET /api/clientes', 'GET /api/servicios');
    const shell = TestBed.createComponent(Shell).componentInstance;
    expect(labels(shell)).toEqual([
      'Panel',
      'Órdenes',
      'Nueva orden',
      'Clientes',
      'Servicios',
      'Mi perfil',
    ]);
    expect(shell.initials()).toBe('OD');
    expect(shell.roleLabel()).toBe('OPERATOR');
  });

  it('el menú reacciona a nuevos permisos sin recargar', () => {
    grant('GET /api/clientes');
    const shell = TestBed.createComponent(Shell).componentInstance;
    expect(labels(shell)).not.toContain('Detalle de órdenes');
    grant('GET /api/clientes', 'GET /api/detalle-ordenes');
    expect(labels(shell)).toContain('Detalle de órdenes');
  });
});
