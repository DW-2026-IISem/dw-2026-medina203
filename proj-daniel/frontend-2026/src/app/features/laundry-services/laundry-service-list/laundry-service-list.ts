import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { GarmentType } from '../../../core/models/garment-type.model';
import {
  LaundryService,
  LaundryServiceCreatePayload,
} from '../../../core/models/laundry-service.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { CopPipe } from '../../../shared/pipes/cop.pipe';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { GarmentTypeApi } from '../../garment-types/garment-type-api';
import { LaundryServiceApi } from '../laundry-service-api';
import { LaundryServiceForm } from '../laundry-service-form/laundry-service-form';

/**
 * Servicios de lavandería con su tipo de prenda. Carga servicios y tipos en
 * paralelo (`forkJoin`) y permite filtrar por texto y por tipo de prenda.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-laundry-service-list',
  imports: [
    ButtonModule,
    CopPipe,
    DialogModule,
    EmptyState,
    FormsModule,
    InputTextModule,
    LaundryServiceForm,
    MessageModule,
    PageHeader,
    SelectModule,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './laundry-service-list.html',
  styleUrl: './laundry-service-list.css',
})
export class LaundryServiceList {
  private readonly api = inject(LaundryServiceApi);
  private readonly garmentTypesApi = inject(GarmentTypeApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<LaundryService[]>([]);
  readonly garmentTypes = signal<GarmentType[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');
  readonly garmentTypeFilter = signal<number | null>(null);

  readonly visibleRows = computed(() => {
    const typeId = this.garmentTypeFilter();
    const byType = typeId ? this.rows().filter((s) => s.garment_type_id === typeId) : this.rows();
    return filterRows(byType, this.filter(), (s) => [s.name, s.description, s.garment_type?.name]);
  });

  readonly dialogVisible = signal(false);
  readonly editing = signal<LaundryService | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() => (this.editing() ? 'Editar servicio' : 'Nuevo servicio'));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({ services: this.api.list(), garmentTypes: this.garmentTypesApi.list() }).subscribe({
      next: ({ services, garmentTypes }) => {
        this.rows.set(services);
        this.garmentTypes.set(garmentTypes);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.rows.set([]);
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  unitLabel(service: LaundryService): string {
    return service.billing_unit === 'kg' ? 'por kg' : 'por prenda';
  }

  openCreate(): void {
    this.editing.set(null);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  openEdit(service: LaundryService): void {
    this.editing.set(service);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  save(payload: LaundryServiceCreatePayload): void {
    const current = this.editing();
    this.saving.set(true);
    const request = current ? this.api.update(current.id, payload) : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Servicio actualizado' : 'Servicio creado');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(service: LaundryService): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar «${service.name}»? No se podrá usar en nuevas órdenes.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () =>
        this.api.deactivate(service.id).subscribe({
          next: () => {
            this.notify.warn('Servicio desactivado');
            this.load();
          },
          error: (error: unknown) =>
            this.notify.error('No se pudo desactivar', toApiMessage(error)),
        }),
    });
  }

  remove(service: LaundryService): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará «${service.name}». Si aparece en órdenes, el backend lo impedirá.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () =>
        this.api.remove(service.id).subscribe({
          next: () => {
            this.notify.success('Servicio eliminado');
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(error)),
        }),
    });
  }
}
