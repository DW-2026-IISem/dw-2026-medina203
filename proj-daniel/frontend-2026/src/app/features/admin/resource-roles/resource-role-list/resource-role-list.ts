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
import { ResourceRole } from '../../../../core/models/admin.model';
import { Resource } from '../../../../core/models/resource.model';
import { Role } from '../../../../core/models/role.model';
import { NotificationService } from '../../../../core/services/notification';
import { toApiMessage } from '../../../../core/utils/api-error';
import { methodSeverity } from '../../../../core/utils/http-method';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { ResourceApi } from '../../resources/resource-api';
import { RoleApi } from '../../roles/role-api';
import { ResourceRoleApi } from '../resource-role-api';

@Component({
  host: { class: 'block' },
  selector: 'app-resource-role-list',
  imports: [
    ButtonModule,
    DialogModule,
    EmptyState,
    FormsModule,
    HasPermission,
    InputTextModule,
    MessageModule,
    PageHeader,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './resource-role-list.html',
  styleUrl: './resource-role-list.css',
})
export class ResourceRoleList {
  private readonly api = inject(ResourceRoleApi);
  private readonly rolesApi = inject(RoleApi);
  private readonly resourcesApi = inject(ResourceApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly methodSeverity = methodSeverity;

  readonly rows = signal<ResourceRole[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly resources = signal<Resource[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  readonly dialogVisible = signal(false);
  readonly selectedRole = signal<Role | null>(null);
  readonly selectedResource = signal<Resource | null>(null);
  readonly canSave = computed(() => !!this.selectedRole() && !!this.selectedResource());

  readonly roleName = computed(() => {
    const map = new Map(this.roles().map((r) => [r.id, r.name]));
    return (id: number) => map.get(id) ?? `Rol #${id}`;
  });
  readonly resourceOf = computed(() => {
    const map = new Map(this.resources().map((r) => [r.id, r]));
    return (id: number) => map.get(id);
  });

  readonly visibleRows = computed(() => {
    const q = this.filter().trim().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter((g) => {
      const res = this.resourceOf()(g.resource_id);
      const role = this.roleName()(g.role_id);
      return [role, res?.path, res?.method, res?.description]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      grants: this.api.list(),
      roles: this.rolesApi.list(),
      resources: this.resourcesApi.list(),
    }).subscribe({
      next: ({ grants, roles, resources }) => {
        this.rows.set(grants);
        this.roles.set(roles);
        this.resources.set(resources);
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
    this.selectedRole.set(null);
    this.selectedResource.set(null);
    this.dialogVisible.set(true);
  }

  save(): void {
    const r = this.selectedRole();
    const res = this.selectedResource();
    if (!r || !res) return;
    this.api.create({ role_id: r.id, resource_id: res.id }).subscribe({
      next: () => {
        this.dialogVisible.set(false);
        this.notify.success('Permiso concedido');
        this.load();
      },
      error: (e: unknown) => this.notify.error('No se pudo conceder', toApiMessage(e)),
    });
  }

  deactivate(row: ResourceRole): void {
    const res = this.resourceOf()(row.resource_id);
    this.confirmation.confirm({
      header: 'Revocar permiso',
      message: `¿Revocar ${res?.method ?? ''} ${res?.path ?? ''} de ${this.roleName()(row.role_id)}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Revocar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () =>
        this.api.deactivate(row.id).subscribe({
          next: () => {
            this.notify.warn('Permiso revocado');
            this.load();
          },
          error: (e: unknown) => this.notify.error('No se pudo revocar', toApiMessage(e)),
        }),
    });
  }
}
