import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { RolePayload } from '../../../../core/models/admin.model';
import { Role } from '../../../../core/models/role.model';
import { NotificationService } from '../../../../core/services/notification';
import { toApiMessage } from '../../../../core/utils/api-error';
import { filterRows } from '../../../../core/utils/filter-rows';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import { RoleApi } from '../role-api';
import { RoleForm } from '../role-form/role-form';

@Component({
  host: { class: 'block' },
  selector: 'app-role-list',
  imports: [
    ButtonModule,
    DialogModule,
    EmptyState,
    HasPermission,
    InputTextModule,
    MessageModule,
    PageHeader,
    RoleForm,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './role-list.html',
  styleUrl: './role-list.css',
})
export class RoleList {
  private readonly api = inject(RoleApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<Role[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');
  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (r) => [r.name, r.description]),
  );
  readonly dialogVisible = signal(false);
  readonly editing = signal<Role | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() => (this.editing() ? 'Editar rol' : 'Nuevo rol'));

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
  openEdit(r: Role): void {
    this.editing.set(r);
    this.resetKey.update((k) => k + 1);
    this.dialogVisible.set(true);
  }

  save(payload: RolePayload): void {
    const current = this.editing();
    this.saving.set(true);
    const req = current ? this.api.update(current.id, payload) : this.api.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Rol actualizado' : 'Rol creado');
        this.load();
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(e));
      },
    });
  }

  deactivate(r: Role): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar «${r.name}»?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () =>
        this.api.deactivate(r.id).subscribe({
          next: () => {
            this.notify.warn('Rol desactivado');
            this.load();
          },
          error: (e: unknown) => this.notify.error('No se pudo desactivar', toApiMessage(e)),
        }),
    });
  }

  remove(r: Role): void {
    this.confirmation.confirm({
      header: 'Eliminar rol',
      message: `Se borrará «${r.name}»`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () =>
        this.api.remove(r.id).subscribe({
          next: () => {
            this.notify.success('Rol eliminado');
            this.load();
          },
          error: (e: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(e)),
        }),
    });
  }
}
