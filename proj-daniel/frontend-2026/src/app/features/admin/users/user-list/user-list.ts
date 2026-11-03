import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { EffectivePermission } from '../../../../core/models/auth.model';
import { UserPayload } from '../../../../core/models/admin.model';
import { User } from '../../../../core/models/user.model';
import { SessionStore } from '../../../../core/services/session-store';
import { NotificationService } from '../../../../core/services/notification';
import { toApiMessage } from '../../../../core/utils/api-error';
import { filterRows } from '../../../../core/utils/filter-rows';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import { UserApi } from '../user-api';
import { UserForm } from '../user-form/user-form';

import { HasPermission } from '../../../../shared/directives/has-permission';

@Component({
  host: { class: 'block' },
  selector: 'app-user-list',
  imports: [
    ButtonModule,
    DialogModule,
    EmptyState,
    HasPermission,
    InputTextModule,
    MessageModule,
    PageHeader,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
    UserForm,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList {
  private readonly api = inject(UserApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly session = inject(SessionStore);

  readonly rows = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');
  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (u) => [u.username, u.email]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<User | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() => (this.editing() ? 'Editar usuario' : 'Nuevo usuario'));

  readonly accessVisible = signal(false);
  readonly accessUser = signal<User | null>(null);
  readonly access = signal<EffectivePermission[]>([]);
  readonly accessRoles = computed(() => {
    const byId = new Map<number, string>();
    for (const p of this.access()) byId.set(p.role_id, p.role_name);
    return [...byId.entries()].map(([id, name]) => ({ id, name }));
  });

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
      error: (e: unknown) => {
        this.rows.set([]);
        this.error.set(toApiMessage(e));
        this.loading.set(false);
      },
    });
  }

  isSelf(user: User): boolean {
    return this.session.user()?.id === user.id;
  }

  openCreate(): void {
    this.editing.set(null);
    this.resetKey.update((k) => k + 1);
    this.dialogVisible.set(true);
  }
  openEdit(u: User): void {
    this.editing.set(u);
    this.resetKey.update((k) => k + 1);
    this.dialogVisible.set(true);
  }

  save(payload: UserPayload): void {
    const current = this.editing();
    this.saving.set(true);
    const req = current ? this.api.update(current.id, payload) : this.api.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Usuario actualizado' : 'Usuario creado');
        this.load();
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(e));
      },
    });
  }

  viewAccess(user: User): void {
    this.accessUser.set(user);
    this.accessVisible.set(true);
    this.api.permissions(user.id).subscribe({
      next: (permissions) => this.access.set(permissions),
      error: (e: unknown) =>
        this.notify.error('No se pudieron cargar los permisos', toApiMessage(e)),
    });
  }

  deactivate(u: User): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar al usuario «${u.username}»?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () =>
        this.api.deactivate(u.id).subscribe({
          next: () => {
            this.notify.warn('Usuario desactivado');
            this.load();
          },
          error: (e: unknown) => this.notify.error('No se pudo desactivar', toApiMessage(e)),
        }),
    });
  }

  remove(u: User): void {
    if (this.isSelf(u)) return;
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará «${u.username}». No se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () =>
        this.api.remove(u.id).subscribe({
          next: () => {
            this.notify.success('Usuario eliminado');
            this.load();
          },
          error: (e: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(e)),
        }),
    });
  }
}
