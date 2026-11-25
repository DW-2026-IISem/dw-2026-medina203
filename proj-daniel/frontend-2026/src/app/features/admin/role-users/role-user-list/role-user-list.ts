import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { RoleUser } from '../../../../core/models/admin.model';
import { Role } from '../../../../core/models/role.model';
import { User } from '../../../../core/models/user.model';
import { NotificationService } from '../../../../core/services/notification';
import { toApiMessage } from '../../../../core/utils/api-error';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { RoleApi } from '../../roles/role-api';
import { UserApi } from '../../users/user-api';
import { RoleUserApi } from '../role-user-api';

@Component({
  host: { class: 'block' },
  selector: 'app-role-user-list',
  imports: [
    ButtonModule,
    DialogModule,
    EmptyState,
    FormsModule,
    HasPermission,
    MessageModule,
    PageHeader,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './role-user-list.html',
  styleUrl: './role-user-list.css',
})
export class RoleUserList {
  private readonly api = inject(RoleUserApi);
  private readonly usersApi = inject(UserApi);
  private readonly rolesApi = inject(RoleApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<RoleUser[]>([]);
  readonly users = signal<User[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly dialogVisible = signal(false);
  readonly selectedUser = signal<User | null>(null);
  readonly selectedRole = signal<Role | null>(null);
  readonly canSave = computed(() => !!this.selectedUser() && !!this.selectedRole());

  readonly userName = computed(() => {
    const map = new Map(this.users().map((u) => [u.id, u.username]));
    return (id: number) => map.get(id) ?? `Usuario #${id}`;
  });
  readonly roleName = computed(() => {
    const map = new Map(this.roles().map((r) => [r.id, r.name]));
    return (id: number) => map.get(id) ?? `Rol #${id}`;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      assignments: this.api.list(),
      users: this.usersApi.list(),
      roles: this.rolesApi.list(),
    }).subscribe({
      next: ({ assignments, users, roles }) => {
        this.rows.set(assignments);
        this.users.set(users);
        this.roles.set(roles);
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
    this.selectedUser.set(null);
    this.selectedRole.set(null);
    this.dialogVisible.set(true);
  }

  save(): void {
    const u = this.selectedUser();
    const r = this.selectedRole();
    if (!u || !r) return;
    this.api.create({ user_id: u.id, role_id: r.id }).subscribe({
      next: () => {
        this.dialogVisible.set(false);
        this.notify.success('Rol asignado');
        this.load();
      },
      error: (e: unknown) => this.notify.error('No se pudo asignar', toApiMessage(e)),
    });
  }

  deactivate(row: RoleUser): void {
    this.confirmation.confirm({
      header: 'Retirar rol',
      message: `¿Retirar ${this.roleName()(row.role_id)} de ${this.userName()(row.user_id)}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Retirar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () =>
        this.api.deactivate(row.id).subscribe({
          next: () => {
            this.notify.warn('Rol retirado');
            this.load();
          },
          error: (e: unknown) => this.notify.error('No se pudo retirar', toApiMessage(e)),
        }),
    });
  }
}
