import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { GarmentType, GarmentTypeCreatePayload } from '../../../core/models/garment-type.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { HasPermission } from '../../../shared/directives/has-permission';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { GarmentTypeApi } from '../garment-type-api';
import { GarmentTypeForm } from '../garment-type-form/garment-type-form';

@Component({
  host: { class: 'block' },
  selector: 'app-garment-type-list',
  imports: [
    HasPermission,
    ButtonModule,
    DialogModule,
    EmptyState,
    InputTextModule,
    MessageModule,
    PageHeader,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
    GarmentTypeForm,
  ],
  templateUrl: './garment-type-list.html',
  styleUrl: './garment-type-list.css',
})
/**
 * Catálogo de tipos de prenda (sábanas, toallas, uniformes…). Cada servicio de
 * lavado pertenece a un tipo de prenda (ISS-05).
 */
export class GarmentTypeList {
  private readonly api = inject(GarmentTypeApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<GarmentType[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (garmentType) => [
      garmentType.name,
      garmentType.description,
    ]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<GarmentType | null>(null);
  readonly resetKey = signal(0);

  readonly title = computed(() =>
    this.editing() ? 'Editar tipo de prenda' : 'Nuevo tipo de prenda',
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.rows.set([]);
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  openEdit(garmentType: GarmentType): void {
    this.editing.set(garmentType);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  save(payload: GarmentTypeCreatePayload): void {
    const current = this.editing();
    this.saving.set(true);

    const request = current ? this.api.update(current.id, payload) : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Tipo de prenda actualizado' : 'Tipo de prenda creado');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(garmentType: GarmentType): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar «${garmentType.name}»? No se podrá asignar a nuevos servicios.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(garmentType.id).subscribe({
          next: () => {
            this.notify.warn('Tipo de prenda desactivado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo desactivar', toApiMessage(error));
          },
        });
      },
    });
  }

  remove(garmentType: GarmentType): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará «${garmentType.name}». Si tiene servicios asociados, el backend lo impedirá.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(garmentType.id).subscribe({
          next: () => {
            this.notify.success('Tipo de prenda eliminado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo eliminar', toApiMessage(error));
          },
        });
      },
    });
  }
}
