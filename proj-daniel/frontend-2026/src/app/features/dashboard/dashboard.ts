import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Observable, forkJoin, of } from 'rxjs';
import { Client } from '../../core/models/client.model';
import { Product } from '../../core/models/product.model';
import { ProductType } from '../../core/models/product-type.model';
import { Sale } from '../../core/models/sale.model';
import { SessionStore } from '../../core/services/session-store';
import { toApiMessage } from '../../core/utils/api-error';
import { toNumber } from '../../core/utils/to-number';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { StatusTag } from '../../shared/ui/status-tag/status-tag';
import { ClientApi } from '../clients/client-api';
import { ProductTypeApi } from '../product-types/product-type-api';
import { ProductApi } from '../products/product-api';
import { SaleApi } from '../sales/sale-api';

import { HasPermission } from '../../shared/directives/has-permission';

@Component({
  host: { class: 'block' },
  selector: 'app-dashboard',
  imports: [
    HasPermission,
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
  private readonly session = inject(SessionStore);

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
      clients: this.ifAllowed('GET /api/clientes', () => this.clientsApi.list()),
      types: this.ifAllowed('GET /api/tipos-producto', () => this.typesApi.list()),
      products: this.ifAllowed('GET /api/productos', () => this.productsApi.list()),
      sales: this.ifAllowed('GET /api/ventas', () => this.salesApi.list()),
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

  /**
   * Solo pide las fuentes que el rol puede leer (ISS-09). Sin esto, un único
   * 403 (p. ej. SELLER sin `GET /api/tipos-producto`) tumbaría todo el
   * `forkJoin` y el panel quedaría vacío.
   */
  private ifAllowed<T>(permission: string, request: () => Observable<T[]>): Observable<T[]> {
    return this.session.canPermission(permission) ? request() : of([]);
  }
}
