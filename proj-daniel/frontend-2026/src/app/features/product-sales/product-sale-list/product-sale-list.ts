import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { Product } from '../../../core/models/product.model';
import {
  ProductSale,
  ProductSalePayload,
} from '../../../core/models/product-sale.model';
import { Sale } from '../../../core/models/sale.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { ProductApi } from '../../products/product-api';
import { SaleApi } from '../../sales/sale-api';
import { ProductSaleApi } from '../product-sale-api';
import { ProductSaleForm } from '../product-sale-form/product-sale-form';

@Component({
  host: { class: 'block' },
  selector: 'app-product-sale-list',
  imports: [
    ButtonModule,
    CurrencyPipe,
    DialogModule,
    EmptyState,
    MessageModule,
    PageHeader,
    ProductSaleForm,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './product-sale-list.html',
  styleUrl: './product-sale-list.css',
})
export class ProductSaleList {
  private readonly api = inject(ProductSaleApi);
  private readonly salesApi = inject(SaleApi);
  private readonly productsApi = inject(ProductApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<ProductSale[]>([]);
  readonly sales = signal<Sale[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly dialogVisible = signal(false);
  readonly editing = signal<ProductSale | null>(null);
  readonly resetKey = signal(0);

  readonly title = computed(() =>
    this.editing() ? 'Editar línea' : 'Nueva línea',
  );

  readonly productName = computed(() => {
    const map = new Map(this.products().map((p) => [p.id, p.name]));
    return (id: number) => map.get(id) ?? `Producto #${id}`;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      lines: this.api.list(),
      sales: this.salesApi.list(),
      products: this.productsApi.list(),
    }).subscribe({
      next: ({ lines, sales, products }) => {
        this.rows.set(lines);
        this.sales.set(sales);
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

  openCreate(): void {
    this.editing.set(null);
    this.resetKey.update((k) => k + 1);
    this.dialogVisible.set(true);
  }

  openEdit(line: ProductSale): void {
    this.editing.set(line);
    this.resetKey.update((k) => k + 1);
    this.dialogVisible.set(true);
  }

  save(value: ProductSalePayload): void {
    const current = this.editing();
    this.saving.set(true);

    const request = current
      ? this.api.update(current.id, { quantity: value.quantity })
      : this.api.create(value);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(
          current ? 'Línea actualizada' : 'Línea creada',
        );
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(line: ProductSale): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar la línea #${line.id}? El stock se restaura.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(line.id).subscribe({
          next: () => {
            this.notify.warn('Línea desactivada');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo desactivar', toApiMessage(error));
          },
        });
      },
    });
  }

  remove(line: ProductSale): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará la línea #${line.id}. El stock se restaura.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(line.id).subscribe({
          next: () => {
            this.notify.success('Línea eliminada');
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
