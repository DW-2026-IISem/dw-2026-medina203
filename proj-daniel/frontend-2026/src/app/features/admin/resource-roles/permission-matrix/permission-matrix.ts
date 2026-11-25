import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, forkJoin } from 'rxjs';
import { Resource } from '../../../../core/models/resource.model';
import { Role } from '../../../../core/models/role.model';
import { AuthService } from '../../../../core/services/auth';
import { NotificationService } from '../../../../core/services/notification';
import { SessionStore } from '../../../../core/services/session-store';
import { toApiMessage } from '../../../../core/utils/api-error';
import { methodSeverity } from '../../../../core/utils/http-method';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { ResourceApi } from '../../resources/resource-api';
import { RoleApi } from '../../roles/role-api';
import {
  CRUD_COLUMNS,
  CrudOperation,
  GrantState,
  MatrixSection,
  PermissionMatrixRow,
  buildPermissionMatrix,
  countChanges,
  grantState,
  specialLabel,
  toggleIds,
} from '../permission-matrix';
import { ResourceRoleApi } from '../resource-role-api';

const SAVE_PERMISSION = 'POST /api/concesiones-rol';

/**
 * Panel "Roles y permisos" (ruta ISS-Crud, ISS-CR-03).
 *
 * 1. Carga roles y recursos en paralelo.
 * 2. Al elegir un rol consulta SUS concesiones activas y arma el `Set` de IDs.
 * 3. Cada casilla agrupa uno o varios recursos (Leer = lista + detalle).
 * 4. Guardar envía el conjunto completo `{ role_id, resource_ids }`; el éxito se
 *    anuncia solo con la respuesta del servidor y luego se recargan concesiones.
 *
 * Es UX: Express vuelve a autorizar cada petición con la matriz guardada.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-permission-matrix',
  imports: [
    ButtonModule,
    EmptyState,
    FormsModule,
    MessageModule,
    PageHeader,
    SelectModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './permission-matrix.html',
  styleUrl: './permission-matrix.css',
})
export class PermissionMatrix {
  private readonly api = inject(ResourceRoleApi);
  private readonly rolesApi = inject(RoleApi);
  private readonly resourcesApi = inject(ResourceApi);
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionStore);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly crudColumns = CRUD_COLUMNS;
  readonly methodSeverity = methodSeverity;
  readonly specialLabel = specialLabel;

  readonly roles = signal<Role[]>([]);
  readonly resources = signal<Resource[]>([]);
  readonly selectedRoleId = signal<number | null>(null);
  /** Selección en pantalla: lo que se enviará al guardar. */
  readonly selectedResourceIds = signal<Set<number>>(new Set());
  /** Última matriz confirmada por el servidor para el rol elegido. */
  readonly savedResourceIds = signal<Set<number>>(new Set());

  readonly loadingCatalog = signal(true);
  readonly loadingGrants = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saveMessage = signal<string | null>(null);

  readonly rows = computed(() => buildPermissionMatrix(this.resources()));
  readonly sections = computed(() => {
    const bySection = new Map<MatrixSection, PermissionMatrixRow[]>();
    for (const row of this.rows()) {
      bySection.set(row.section, [...(bySection.get(row.section) ?? []), row]);
    }
    return [...bySection.entries()].map(([name, rows]) => ({ name, rows }));
  });
  readonly selectedRole = computed(
    () => this.roles().find((role) => role.id === this.selectedRoleId()) ?? null,
  );
  readonly canEdit = computed(() => this.session.canPermission(SAVE_PERMISSION));
  readonly busy = computed(() => this.loadingCatalog() || this.loadingGrants() || this.saving());
  readonly pendingChanges = computed(() =>
    countChanges(this.selectedResourceIds(), this.savedResourceIds()),
  );
  readonly canSave = computed(
    () => this.canEdit() && this.selectedRoleId() !== null && !this.busy() && this.pendingChanges() > 0,
  );

  private grantsRequest?: Subscription;

  constructor() {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.loadingCatalog.set(true);
    this.error.set(null);
    forkJoin({ roles: this.rolesApi.list(), resources: this.resourcesApi.list() }).subscribe({
      next: ({ roles, resources }) => {
        this.roles.set(roles.filter((role) => role.status === 'active'));
        this.resources.set(resources.filter((resource) => resource.status === 'active'));
        this.loadingCatalog.set(false);
        const first = this.roles()[0];
        if (first && this.selectedRoleId() === null) this.selectRole(first.id);
      },
      error: (e: unknown) => {
        this.error.set(toApiMessage(e));
        this.loadingCatalog.set(false);
      },
    });
  }

  /** Cambiar de rol descarta la selección y los mensajes anteriores. */
  selectRole(roleId: number | null): void {
    this.selectedRoleId.set(roleId);
    this.selectedResourceIds.set(new Set());
    this.savedResourceIds.set(new Set());
    this.saveMessage.set(null);
    this.saveError.set(null);
    if (roleId === null) {
      this.grantsRequest?.unsubscribe();
      this.loadingGrants.set(false);
      return;
    }
    this.loadRoleGrants(roleId);
  }

  isGranted(ids: readonly number[]): boolean {
    return this.state(ids) === 'all';
  }

  isPartial(ids: readonly number[]): boolean {
    return this.state(ids) === 'some';
  }

  idsOf(row: PermissionMatrixRow, operation: CrudOperation): number[] {
    return row.operations[operation].map((resource) => resource.id);
  }

  /** Marca o desmarca TODOS los recursos que agrupa la casilla. */
  toggle(ids: readonly number[], event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.setIds(ids, checked);
  }

  setIds(ids: readonly number[], checked: boolean): void {
    this.selectedResourceIds.set(toggleIds(this.selectedResourceIds(), ids, checked));
    this.saveMessage.set(null);
  }

  rowGrantedCount(row: PermissionMatrixRow): number {
    const selected = this.selectedResourceIds();
    return row.resourceIds.filter((id) => selected.has(id)).length;
  }

  markAll(): void {
    const role = this.selectedRole();
    if (!role) return;
    this.confirmation.confirm({
      header: 'Marcar todos los permisos',
      message: `Se marcarán las ${this.resources().length} operaciones del catálogo para ${role.name}, incluida la administración de seguridad. No se guarda hasta pulsar «Guardar permisos».`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Marcar todo',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warn',
      accept: () => this.setIds(this.resources().map((resource) => resource.id), true),
    });
  }

  unmarkAll(): void {
    this.setIds(this.resources().map((resource) => resource.id), false);
  }

  discardChanges(): void {
    this.selectedResourceIds.set(new Set(this.savedResourceIds()));
    this.saveError.set(null);
  }

  savePermissionMatrix(): void {
    const roleId = this.selectedRoleId();
    if (roleId === null || this.saving() || this.loadingGrants() || !this.canEdit()) return;
    this.saving.set(true);
    this.saveError.set(null);
    this.saveMessage.set(null);
    const resourceIds = [...this.selectedResourceIds()].sort((a, b) => a - b);

    this.api.reconcileRole(roleId, resourceIds).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.saveMessage.set(
          `Cambios guardados. ${result.total_active} permisos activos para este rol ` +
            `(+${result.activated} / −${result.deactivated}).`,
        );
        this.notify.success('Permisos guardados', this.selectedRole()?.name);
        this.loadRoleGrants(roleId, true);
        // Si el usuario cambió un rol que él mismo tiene, refresca su menú/permisos.
        if (this.session.roles().some((role) => role.id === roleId)) {
          this.auth.me().subscribe({ error: () => undefined });
        }
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.saveError.set(toApiMessage(e));
      },
    });
  }

  private state(ids: readonly number[]): GrantState {
    return grantState(ids, this.selectedResourceIds());
  }

  private loadRoleGrants(roleId: number, keepMessage = false): void {
    this.grantsRequest?.unsubscribe();
    this.loadingGrants.set(true);
    if (!keepMessage) this.saveMessage.set(null);
    const catalog = new Set(this.resources().map((resource) => resource.id));

    this.grantsRequest = this.api.list({ role_id: roleId }).subscribe({
      next: (grants) => {
        if (this.selectedRoleId() !== roleId) return;
        // Solo IDs que la pantalla recibió en el catálogo: nunca se envían otros.
        const ids = new Set(
          grants
            .filter((grant) => grant.role_id === roleId && grant.status === 'active')
            .map((grant) => grant.resource_id)
            .filter((id) => catalog.has(id)),
        );
        this.savedResourceIds.set(ids);
        this.selectedResourceIds.set(new Set(ids));
        this.loadingGrants.set(false);
      },
      error: (e: unknown) => {
        this.saveError.set(toApiMessage(e));
        this.loadingGrants.set(false);
      },
    });
  }
}
