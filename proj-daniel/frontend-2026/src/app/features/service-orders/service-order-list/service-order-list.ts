import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Customer } from '../../../core/models/customer.model';
import {
  NEXT_PROCESS_STATUS,
  PROCESS_STATUS_LABELS,
  ProcessStatus,
  ServiceOrder,
} from '../../../core/models/service-order.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { toNumber } from '../../../core/utils/to-number';
import { CopPipe } from '../../../shared/pipes/cop.pipe';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ProcessStatusTag } from '../../../shared/ui/process-status-tag/process-status-tag';
import { CustomerApi } from '../../customers/customer-api';
import { ServiceOrderApi } from '../service-order-api';

/**
 * Órdenes de servicio activas. Los filtros por estado del proceso y por cliente
 * se envían al backend (`?process_status=&customer_id=`). Desde aquí se avanza
 * el proceso un paso, se anula o se elimina una orden.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-service-order-list',
  imports: [
    ButtonModule,
    CopPipe,
    DatePipe,
    EmptyState,
    FormsModule,
    MessageModule,
    PageHeader,
    ProcessStatusTag,
    RouterLink,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './service-order-list.html',
  styleUrl: './service-order-list.css',
})
export class ServiceOrderList {
  private readonly api = inject(ServiceOrderApi);
  private readonly customersApi = inject(CustomerApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<ServiceOrder[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);

  readonly statusFilter = signal<ProcessStatus | null>(null);
  readonly customerFilter = signal<number | null>(null);

  readonly statusOptions = (Object.keys(PROCESS_STATUS_LABELS) as ProcessStatus[]).map((value) => ({
    label: PROCESS_STATUS_LABELS[value],
    value,
  }));

  /** Suma de los totales visibles (lo que se facturaría con estos filtros). */
  readonly totalAmount = computed(() =>
    this.rows().reduce((sum, order) => sum + toNumber(order.total), 0),
  );

  constructor() {
    this.loadCustomers();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list({
        process_status: this.statusFilter() ?? undefined,
        customer_id: this.customerFilter() ?? undefined,
      })
      .subscribe({
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

  setStatusFilter(value: ProcessStatus | null): void {
    this.statusFilter.set(value);
    this.load();
  }

  setCustomerFilter(value: number | null): void {
    this.customerFilter.set(value);
    this.load();
  }

  /** Texto del botón de avance, o `null` si la orden ya fue entregada. */
  nextLabel(order: ServiceOrder): string | null {
    const next = NEXT_PROCESS_STATUS[order.process_status];
    return next ? PROCESS_STATUS_LABELS[next] : null;
  }

  advance(order: ServiceOrder): void {
    const next = NEXT_PROCESS_STATUS[order.process_status];
    if (!next) return;

    this.busyId.set(order.id);
    this.api.changeStatus(order.id, next).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.rows.update((rows) =>
          rows.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
        );
        this.notify.success(`Orden #${order.id}: ${PROCESS_STATUS_LABELS[next]}`);
        // Si hay filtro por estado, la orden ya no pertenece a la vista.
        if (this.statusFilter()) this.load();
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.notify.error('No se pudo cambiar el estado', toApiMessage(error));
      },
    });
  }

  cancel(order: ServiceOrder): void {
    this.confirmation.confirm({
      header: 'Anular orden',
      message: `¿Anular la orden #${order.id} de ${order.customer?.business_name ?? 'este cliente'}? Sus líneas también se desactivan.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Anular',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () =>
        this.api.deactivate(order.id).subscribe({
          next: () => {
            this.notify.warn(`Orden #${order.id} anulada`);
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo anular', toApiMessage(error)),
        }),
    });
  }

  remove(order: ServiceOrder): void {
    this.confirmation.confirm({
      header: 'Eliminar orden',
      message: `Se borrará la orden #${order.id} y todas sus líneas. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () =>
        this.api.remove(order.id).subscribe({
          next: () => {
            this.notify.success('Orden eliminada');
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(error)),
        }),
    });
  }

  private loadCustomers(): void {
    this.customersApi.list().subscribe({
      next: (customers) => this.customers.set(customers),
      error: () => this.customers.set([]),
    });
  }
}
