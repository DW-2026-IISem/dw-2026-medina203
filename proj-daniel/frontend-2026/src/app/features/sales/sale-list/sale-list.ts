import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { Client } from '../../../core/models/client.model';
import { Product } from '../../../core/models/product.model';
import { Sale } from '../../../core/models/sale.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { ClientApi } from '../../clients/client-api';
import { ProductSaleApi } from '../../product-sales/product-sale-api';
import { ProductApi } from '../../products/product-api';
import { SaleApi } from '../sale-api';
import { SaleDetail } from '../sale-detail/sale-detail';

import { HasPermission } from '../../../shared/directives/has-permission';

@Component({
  host: { class: 'block' },
  selector: 'app-sale-list',
  imports: [
    HasPermission,
    ButtonModule,
    CurrencyPipe,
    DatePipe,
    DialogModule,
    EmptyState,
    MessageModule,
    PageHeader,
    RouterLink,
    SaleDetail,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './sale-list.html',
  styleUrl: './sale-list.css',
})
export class SaleList {
  private readonly api = inject(SaleApi);
  private readonly clientsApi = inject(ClientApi);
  private readonly productsApi = inject(ProductApi);
  private readonly linesApi = inject(ProductSaleApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<Sale[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly clientName = computed(() => {
    const map = new Map(this.clients().map((c) => [c.id, c.name]));
    return (id: number) => map.get(id) ?? `Cliente #${id}`;
  });

  readonly detailVisible = signal(false);
  readonly selected = signal<Sale | null>(null);
  readonly detailLoading = signal(false);

  readonly detailTitle = computed(() => {
    const s = this.selected();
    return s ? `Venta #${s.id}` : 'Detalle';
  });

  constructor() {
    this.load();
  }

  /**
   * `GET /api/ventas` no incluye las líneas, así que el detalle las pide a
   * `/api/detalle-ventas` y filtra por `sale_id` antes de pasarlas a
   * `SaleDetail` (que sigue siendo presentacional).
   */
  openDetail(sale: Sale): void {
    this.selected.set(sale);
    this.detailVisible.set(true);
    if (sale.items) return;

    this.detailLoading.set(true);
    this.linesApi.list().subscribe({
      next: (lines) => {
        const items = lines.filter((line) => line.sale_id === sale.id);
        this.selected.set({ ...sale, items });
        this.detailLoading.set(false);
      },
      error: (error: unknown) => {
        this.detailLoading.set(false);
        this.notify.error('No se pudo cargar el detalle', toApiMessage(error));
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      sales: this.api.list(),
      clients: this.clientsApi.list(),
      products: this.productsApi.list(),
    }).subscribe({
      next: ({ sales, clients, products }) => {
        this.rows.set(sales);
        this.clients.set(clients);
        this.products.set(products);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.rows.set([]);
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  items(sale: Sale): number {
    return (sale.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
  }

  deactivate(sale: Sale): void {
    this.confirmation.confirm({
      header: 'Cancelar venta',
      message: `¿Cancelar la venta #${sale.id}? El stock de sus líneas activas se restaura.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Cancelar venta',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(sale.id).subscribe({
          next: () => {
            this.notify.warn(`Venta #${sale.id} cancelada`);
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo cancelar', toApiMessage(error));
          },
        });
      },
    });
  }

  remove(sale: Sale): void {
    this.confirmation.confirm({
      header: 'Eliminar venta',
      message: `Se borrará la venta #${sale.id} y sus líneas. El stock se restaura.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(sale.id).subscribe({
          next: () => {
            this.notify.success('Venta eliminada');
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
