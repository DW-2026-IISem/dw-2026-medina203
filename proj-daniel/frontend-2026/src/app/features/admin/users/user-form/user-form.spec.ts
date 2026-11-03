import { TestBed } from '@angular/core/testing';
import { User } from '../../../../core/models/user.model';
import { UserForm } from './user-form';

const USER: User = {
  id: 2,
  username: 'seller',
  email: 'seller@textilclean.local',
  avatar: 'https://x/a.png',
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

  it('should send password and status only when creating', () => {
    const { form, out } = crear(null);
    form.form.patchValue({
      username: ' nuevo ',
      email: 'n@x.co',
      password: 'Secreta123',
      status: 'active',
    });
    form.submit();
    expect(out).toEqual([
      {
        username: 'nuevo',
        email: 'n@x.co',
        avatar: null,
        status: 'active',
        password: 'Secreta123',
      },
    ]);
  });

  it('should require a password of 8+ characters when creating', () => {
    const { form, out } = crear(null);
    form.form.patchValue({ username: 'nuevo', email: 'n@x.co', password: 'corta' });
    form.submit();
    expect(out).toEqual([]);
  });

  it('should PATCH without password nor status and keep the avatar', () => {
    const { form, out } = crear(USER);
    expect(form.form.controls.password.disabled).toBe(true);
    expect(form.form.controls.status.disabled).toBe(true);
    form.form.patchValue({ email: 'otro@x.co' });
    form.submit();
    expect(out).toEqual([{ username: 'seller', email: 'otro@x.co', avatar: 'https://x/a.png' }]);
  });
});
