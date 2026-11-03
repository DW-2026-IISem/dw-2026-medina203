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
import { ResourcePayload } from '../../../../core/models/admin.model';
import { HttpMethod, Resource } from '../../../../core/models/resource.model';
import { NotificationService } from '../../../../core/services/notification';
import { toApiMessage } from '../../../../core/utils/api-error';
import { filterRows } from '../../../../core/utils/filter-rows';
import { HTTP_METHODS, methodSeverity } from '../../../../core/utils/http-method';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import { ResourceApi } from '../resource-api';
import { ResourceForm } from '../resource-form/resource-form';

@Component({
  host: { class: 'block' },
  selector: 'app-resource-list',
  imports: [
    ButtonModule,
    DialogModule,
    EmptyState,
    FormsModule,
    HasPermission,
    InputTextModule,
    MessageModule,
    PageHeader,
    ResourceForm,
    SelectModule,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './resource-list.html',
  styleUrl: './resource-list.css',
})
export class ResourceList {
  private readonly api = inject(ResourceApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly methods = HTTP_METHODS;
  readonly methodSeverity = methodSeverity;

  readonly rows = signal<Resource[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');
  readonly methodFilter = signal<HttpMethod | null>(null);

  readonly countsByMethod = computed(() => {
    const c = new Map<string, number>();
    for (const row of this.rows()) c.set(row.method, (c.get(row.method) ?? 0) + 1);
    return c;
  });

  readonly visibleRows = computed(() => {
    const m = this.methodFilter();
    const filtered = filterRows(this.rows(), this.filter(), (r) => [
      r.path,
      r.description,
      r.method,
    ]);
    return m ? filtered.filter((r) => r.method === m) : filtered;
  });

  readonly dialogVisible = signal(false);
  readonly editing = signal<Resource | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() => (this.editing() ? 'Editar recurso' : 'Nuevo recurso'));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.rows.set([]);
        this.error.set(toApiMessage(e));
        this.loading.set(false);
      },
    });
  }
  openCreate(): void {
    this.editing.set(null);
    this.resetKey.update((k) => k + 1);
    this.dialogVisible.set(true);
  }
  openEdit(r: Resource): void {
    this.editing.set(r);
    this.resetKey.update((k) => k + 1);
    this.dialogVisible.set(true);
  }

  save(payload: ResourcePayload): void {
    const current = this.editing();
    this.saving.set(true);
    const req = current ? this.api.update(current.id, payload) : this.api.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Recurso actualizado' : 'Recurso creado');
        this.load();
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(e));
      },
    });
  }

  deactivate(r: Resource): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar ${r.method} ${r.path}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () =>
        this.api.deactivate(r.id).subscribe({
          next: () => {
            this.notify.warn('Recurso desactivado');
            this.load();
          },
          error: (e: unknown) => this.notify.error('No se pudo desactivar', toApiMessage(e)),
        }),
    });
  }

  remove(r: Resource): void {
    this.confirmation.confirm({
      header: 'Eliminar recurso',
      message: `Se borrará ${r.method} ${r.path}. Rompe las concesiones históricas.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () =>
        this.api.remove(r.id).subscribe({
          next: () => {
            this.notify.success('Recurso eliminado');
            this.load();
          },
          error: (e: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(e)),
        }),
    });
  }
}
