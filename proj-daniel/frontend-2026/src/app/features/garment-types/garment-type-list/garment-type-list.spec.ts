import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { GarmentTypeForm } from '../garment-type-form/garment-type-form';
import { GarmentTypeList } from './garment-type-list';

const URL = `${environment.apiUrl}/tipos-prenda`;

describe('GarmentTypeList y GarmentTypeForm', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GarmentTypeList, GarmentTypeForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        ConfirmationService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carga y filtra por descripción', () => {
    const list = TestBed.createComponent(GarmentTypeList).componentInstance;
    http.expectOne(URL).flush({
      garment_types: [
        { id: 1, name: 'Sábanas', description: 'Cama doble', status: 'active' },
        { id: 2, name: 'Batas médicas', description: 'Pijamas quirúrgicas', status: 'active' },
      ],
    });
    list.filter.set('quirúrg');
    expect(list.visibleRows().map((g) => g.name)).toEqual(['Batas médicas']);
  });

  it('crea con POST y recarga', () => {
    const list = TestBed.createComponent(GarmentTypeList).componentInstance;
    http.expectOne(URL).flush({ garment_types: [] });
    list.openCreate();
    list.save({ name: 'Tapetes', description: null });
    http.expectOne({ method: 'POST', url: URL }).flush({ garment_type: { id: 3 } });
    http.expectOne(URL).flush({ garment_types: [] });
    expect(list.dialogVisible()).toBe(false);
  });

  it('el formulario exige nombre y recorta espacios', () => {
    const fixture = TestBed.createComponent(GarmentTypeForm);
    fixture.detectChanges();
    const form = fixture.componentInstance;
    const emitted: unknown[] = [];
    form.saved.subscribe((p) => emitted.push(p));

    form.submit();
    expect(emitted).toHaveLength(0);

    form.form.setValue({ name: '  Toallas ', description: '' });
    form.submit();
    expect(emitted[0]).toEqual({ name: 'Toallas', description: null });
  });
});
