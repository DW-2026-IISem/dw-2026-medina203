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
import { LaundryService } from '../../../core/models/laundry-service.model';
import { ServiceOrder } from '../../../core/models/service-order.model';
import {
  ServiceOrderItem,
  ServiceOrderItemCreatePayload,
} from '../../../core/models/service-order-item.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { toNumber } from '../../../core/utils/to-number';
import { CopPipe } from '../../../shared/pipes/cop.pipe';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ProcessStatusTag } from '../../../shared/ui/process-status-tag/process-status-tag';
import { LaundryServiceApi } from '../../laundry-services/laundry-service-api';
import { ServiceOrderApi } from '../../service-orders/service-order-api';
import { ServiceOrderItemApi } from '../service-order-item-api';
import { ServiceOrderItemForm } from '../service-order-item-form/service-order-item-form';

/**
 * Detalle de órdenes: todas las líneas activas, filtrables por orden. Permite
 * agregar líneas a órdenes abiertas y corregir prendas o peso; cada cambio
 * recalcula en el backend los totales de la orden.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-service-order-item-list',
  imports: [
    ButtonModule,
    CopPipe,
    DialogModule,
    EmptyState,
    FormsModule,
    MessageModule,
    PageHeader,
    ProcessStatusTag,
    SelectModule,
    ServiceOrderItemForm,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './service-order-item-list.html',
})
export class ServiceOrderItemList {
  private readonly api = inject(ServiceOrderItemApi);
  private readonly ordersApi = inject(ServiceOrderApi);
  private readonly servicesApi = inject(LaundryServiceApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<ServiceOrderItem[]>([]);
  readonly orders = signal<ServiceOrder[]>([]);
  readonly services = signal<LaundryService[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly orderFilter = signal<number | null>(null);

  readonly orderById = computed(() => new Map(this.orders().map((o) => [o.id, o])));

  /** Solo las órdenes no entregadas admiten líneas nuevas o cambios. */
  readonly openOrders = computed(() =>
    this.orders().filter((o) => o.process_status !== 'delivered'),
  );

  readonly orderOptions = computed(() =>
    this.orders().map((o) => ({
      id: o.id,
      label: `#${o.id} · ${o.customer?.business_name ?? 'Cliente #' + o.customer_id}`,
    })),
  );

  readonly visibleRows = computed(() => {
    const id = this.orderFilter();
    return id ? this.rows().filter((r) => r.service_order_id === id) : this.rows();
  });

  readonly visibleTotal = computed(() =>
    this.visibleRows().reduce((sum, row) => sum + toNumber(row.line_total), 0),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<ServiceOrderItem | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() => (this.editing() ? 'Editar línea' : 'Agregar línea a una orden'));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      items: this.api.list(),
      orders: this.ordersApi.list(),
      services: this.servicesApi.list(),
    }).subscribe({
      next: ({ items, orders, services }) => {
        this.rows.set(items);
        this.orders.set(orders);
        this.services.set(services);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.rows.set([]);
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  isEditable(item: ServiceOrderItem): boolean {
    return this.orderById().get(item.service_order_id)?.process_status !== 'delivered';
  }

  openCreate(): void {
    this.editing.set(null);
    this.resetKey.update((k) => k + 1);
    this.dialogVisible.set(true);
  }

  openEdit(item: ServiceOrderItem): void {
    this.editing.set(item);
    this.resetKey.update((k) => k + 1);
    this.dialogVisible.set(true);
  }

  save(payload: ServiceOrderItemCreatePayload): void {
    const current = this.editing();
    this.saving.set(true);
    const request = current
      ? this.api.update(current.id, { quantity: payload.quantity, weight_kg: payload.weight_kg })
      : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(
          current ? 'Línea actualizada' : 'Línea agregada',
          'Totales de la orden recalculados.',
        );
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(item: ServiceOrderItem): void {
    this.confirmation.confirm({
      header: 'Quitar línea',
      message: `¿Quitar la línea #${item.id} de la orden #${item.service_order_id}? El total de la orden se recalcula.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () =>
        this.api.deactivate(item.id).subscribe({
          next: () => {
            this.notify.warn('Línea desactivada');
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo quitar', toApiMessage(error)),
        }),
    });
  }

  remove(item: ServiceOrderItem): void {
    this.confirmation.confirm({
      header: 'Eliminar línea',
      message: `Se borrará la línea #${item.id}. El total de la orden se recalcula.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () =>
        this.api.remove(item.id).subscribe({
          next: () => {
            this.notify.success('Línea eliminada');
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(error)),
        }),
    });
  }
}
