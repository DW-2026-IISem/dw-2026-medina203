import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { forkJoin } from 'rxjs';
import { DashboardData } from '../../core/models/dashboard.model';
import { PROCESS_STATUS_LABELS, ProcessStatus } from '../../core/models/service-order.model';
import { toApiMessage } from '../../core/utils/api-error';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { ProcessStatusTag } from '../../shared/ui/process-status-tag/process-status-tag';
import { CustomerApi } from '../customers/customer-api';
import { LaundryServiceApi } from '../laundry-services/laundry-service-api';
import { ServiceOrderApi } from '../service-orders/service-order-api';
import { buildDashboard } from './dashboard-data';

/**
 * Panel de la planta: 3 consultas en paralelo (clientes, servicios y órdenes)
 * y los indicadores calculados con `buildDashboard`.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    CopPipe,
    DatePipe,
    MessageModule,
    PageHeader,
    ProcessStatusTag,
    RouterLink,
    SkeletonModule,
    TableModule,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly customersApi = inject(CustomerApi);
  private readonly servicesApi = inject(LaundryServiceApi);
  private readonly ordersApi = inject(ServiceOrderApi);

  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly statuses: { value: ProcessStatus; label: string; icon: string }[] = [
    { value: 'received', label: PROCESS_STATUS_LABELS.received, icon: 'pi pi-inbox' },
    { value: 'in_process', label: PROCESS_STATUS_LABELS.in_process, icon: 'pi pi-sync' },
    { value: 'ready', label: PROCESS_STATUS_LABELS.ready, icon: 'pi pi-check-circle' },
    { value: 'delivered', label: PROCESS_STATUS_LABELS.delivered, icon: 'pi pi-truck' },
  ];

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      customers: this.customersApi.list(),
      services: this.servicesApi.list(),
      orders: this.ordersApi.list(),
    }).subscribe({
      next: ({ customers, services, orders }) => {
        this.data.set(buildDashboard(customers, services, orders));
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }
}
