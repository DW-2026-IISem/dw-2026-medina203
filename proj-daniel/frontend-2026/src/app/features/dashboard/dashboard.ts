import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { forkJoin } from 'rxjs';
import { Client } from '../../core/models/client.model';
import { Product } from '../../core/models/product.model';
import { ProductType } from '../../core/models/product-type.model';
import { Sale } from '../../core/models/sale.model';
import { toApiMessage } from '../../core/utils/api-error';
import { toNumber } from '../../core/utils/to-number';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { StatusTag } from '../../shared/ui/status-tag/status-tag';
import { ClientApi } from '../clients/client-api';
import { ProductTypeApi } from '../product-types/product-type-api';
import { ProductApi } from '../products/product-api';
import { SaleApi } from '../sales/sale-api';

@Component({
  host: { class: 'block' },
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    CardModule,
    CurrencyPipe,
    DatePipe,
    MessageModule,
    PageHeader,
    RouterLink,
    SkeletonModule,
    StatusTag,
    TableModule,
    TagModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly clientsApi = inject(ClientApi);
  private readonly typesApi = inject(ProductTypeApi);
  private readonly productsApi = inject(ProductApi);
  private readonly salesApi = inject(SaleApi);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly clients = signal<Client[]>([]);
  readonly types = signal<ProductType[]>([]);
  readonly products = signal<Product[]>([]);
  readonly sales = signal<Sale[]>([]);

  readonly lowStock = computed(() =>
    this.products().filter((p) => p.quantity <= p.min_stock),
  );

  readonly revenue = computed(() =>
    this.sales().reduce((sum, sale) => sum + toNumber(sale.total), 0),
  );

  readonly latestSales = computed(() =>
    [...this.sales()]
      .sort(
        (a, b) =>
          new Date(b.sale_date ?? 0).getTime() -
          new Date(a.sale_date ?? 0).getTime(),
      )
      .slice(0, 5),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      clients: this.clientsApi.list(),
      types: this.typesApi.list(),
      products: this.productsApi.list(),
      sales: this.salesApi.list(),
    }).subscribe({
      next: ({ clients, types, products, sales }) => {
        this.clients.set(clients);
        this.types.set(types);
        this.products.set(products);
        this.sales.set(sales);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }
}
