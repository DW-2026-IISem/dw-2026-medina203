import { TestBed } from '@angular/core/testing';
import { ResourceForm } from './resource-form';

describe('ResourceForm', () => {
  function crear() {
    const fixture = TestBed.createComponent(ResourceForm);
    fixture.detectChanges();
    const out: unknown[] = [];
    fixture.componentInstance.saved.subscribe((p) => out.push(p));
    return { form: fixture.componentInstance, out };
  }

  it('should reject a path that does not start with /', () => {
    const { form, out } = crear();
    form.form.patchValue({ path: 'api/reportes', method: 'GET' });
    form.submit();
    expect(form.form.controls.path.invalid).toBe(true);
    expect(out).toEqual([]);
  });

  it('should emit method + path with status when creating', () => {
    const { form, out } = crear();
    form.form.patchValue({ path: '/api/reportes ', method: 'POST', description: '' });
    form.submit();
    expect(out).toEqual([
      { path: '/api/reportes', method: 'POST', description: null, status: 'active' },
    ]);
  });
});
