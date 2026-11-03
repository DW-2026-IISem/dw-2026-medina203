import { TestBed } from '@angular/core/testing';
import { RoleForm } from './role-form';

describe('RoleForm', () => {
  it('should store the role name in UPPERCASE', () => {
    const fixture = TestBed.createComponent(RoleForm);
    fixture.detectChanges();
    const out: unknown[] = [];
    fixture.componentInstance.saved.subscribe((p) => out.push(p));
    fixture.componentInstance.form.patchValue({ name: ' auditor ', description: '' });
    fixture.componentInstance.submit();
    expect((out[0] as { name: string }).name).toBe('AUDITOR');
  });
});
