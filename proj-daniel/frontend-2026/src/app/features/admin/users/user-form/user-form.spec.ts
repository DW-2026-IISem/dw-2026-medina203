import { TestBed } from '@angular/core/testing';
import { User } from '../../../../core/models/user.model';
import { UserForm } from './user-form';

const OPERARIO: User = {
  id: 2,
  username: 'operador',
  full_name: 'Operario de planta',
  email: 'operador@textilclean.local',
  avatar: null,
  status: 'active',
};

describe('UserForm', () => {
  function crear(user: User | null) {
    const fixture = TestBed.createComponent(UserForm);
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();
    const out: unknown[] = [];
    fixture.componentInstance.saved.subscribe((p) => out.push(p));
    return { form: fixture.componentInstance, out };
  }

  it('al crear envía nombre completo, contraseña y estado; normaliza usuario y correo', () => {
    const { form, out } = crear(null);
    form.form.patchValue({
      username: ' Lavador.Turno1 ',
      full_name: ' Carlos Pushaina ',
      email: 'Lavador1@TextilClean.local',
      password: 'Password123!',
      status: 'active',
    });
    form.submit();
    expect(out).toEqual([
      {
        username: 'lavador.turno1',
        full_name: 'Carlos Pushaina',
        email: 'lavador1@textilclean.local',
        avatar: null,
        status: 'active',
        password: 'Password123!',
      },
    ]);
  });

  it('exige una contraseña de 8 caracteres o más al crear', () => {
    const { form, out } = crear(null);
    form.form.patchValue({ username: 'nuevo', email: 'n@x.co', password: 'corta' });
    form.submit();
    expect(out).toEqual([]);
  });

  it('al editar no envía contraseña ni estado', () => {
    const { form, out } = crear(OPERARIO);
    expect(form.form.controls.password.disabled).toBe(true);
    expect(form.form.controls.status.disabled).toBe(true);
    expect(form.form.controls.full_name.value).toBe('Operario de planta');
    form.form.patchValue({ full_name: 'Operaria de planta' });
    form.submit();
    expect(out).toEqual([
      {
        username: 'operador',
        full_name: 'Operaria de planta',
        email: 'operador@textilclean.local',
        avatar: null,
      },
    ]);
  });
});
