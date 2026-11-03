import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { forkJoin } from 'rxjs';
import { Client } from '../../../core/models/client.model';
import { Product } from '../../../core/models/product.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ClientApi } from '../../clients/client-api';
import { ProductApi } from '../../products/product-api';
import { SaleApi } from '../sale-api';

interface DraftLine {
  product_id: number;
  quantity: number;
}

@Component({
  host: { class: 'block' },
  selector: 'app-sale-form',
  imports: [
    ButtonModule,
    CardModule,
    CurrencyPipe,
    FormsModule,
    InputNumberModule,
    MessageModule,
    PageHeader,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './sale-form.html',
  styleUrl: './sale-form.css',
})
export class SaleForm {
  private readonly api = inject(SaleApi);
  private readonly clientsApi = inject(ClientApi);
  private readonly productsApi = inject(ProductApi);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  readonly clients = signal<Client[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly clientId = signal<number | null>(null);
  readonly tax = signal(0);
  readonly discounts = signal(0);

  readonly lines = signal<DraftLine[]>([]);
  readonly selectedProductId = signal<number | null>(null);
  readonly quantity = signal(1);

  readonly productById = computed(() => {
    const map = new Map(this.products().map((p) => [p.id, p]));
    return map;
  });

  /** Subtotal calculado desde el precio actual del producto. */
  readonly subtotal = computed(() =>
    this.lines().reduce((sum, line) => {
      const product = this.productById().get(line.product_id);
      return sum + Number(product?.price ?? 0) * line.quantity;
    }, 0),
  );

  readonly total = computed(
    () => this.subtotal() + Number(this.tax() ?? 0) - Number(this.discounts() ?? 0),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      clients: this.clientsApi.list(),
      products: this.productsApi.list(),
    }).subscribe({
      next: ({ clients, products }) => {
        this.clients.set(clients);
        this.products.set(products);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  lineTotal(line: DraftLine): number {
    const product = this.productById().get(line.product_id);
    return Number(product?.price ?? 0) * line.quantity;
  }

  addLine(): void {
    const productId = this.selectedProductId();
    const requested = Number(this.quantity());
    this.error.set(null);

    if (productId === null) {
      this.error.set('Selecciona un producto.');
      return;
    }
    if (!Number.isFinite(requested) || requested < 1) {
      this.error.set('La cantidad debe ser al menos 1.');
      return;
    }

    const product = this.productById().get(productId);
    if (!product) {
      return;
    }

    const already = this.lines()
      .filter((line) => line.product_id === productId)
      .reduce((sum, line) => sum + line.quantity, 0);

    if (already + requested > product.quantity) {
      this.error.set(
        `Stock insuficiente de «${product.name}»: disponible ${product.quantity}, solicitado ${already + requested}.`,
      );
      return;
    }

    this.lines.update((lines) => {
      const found = lines.find((line) => line.product_id === productId);
      if (!found) {
        return [...lines, { product_id: productId, quantity: requested }];
      }
      return lines.map((line) =>
        line.product_id === productId ? { ...line, quantity: line.quantity + requested } : line,
      );
    });

    this.selectedProductId.set(null);
    this.quantity.set(1);
  }

  removeLine(index: number): void {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
  }

  save(): void {
    const clientId = this.clientId();
    if (clientId === null) {
      this.error.set('Selecciona un cliente activo.');
      return;
    }
    if (this.lines().length === 0) {
      this.error.set('La venta requiere al menos una línea.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.api
      .create({
        client_id: clientId,
        tax: Number(this.tax() ?? 0),
        discounts: Number(this.discounts() ?? 0),
        items: this.lines(),
      })
      .subscribe({
        next: (sale) => {
          this.saving.set(false);
          this.notify.success(`Venta #${sale.id} registrada`, 'Stock y totales actualizados.');
          void this.router.navigate(['/ventas']);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          const message = toApiMessage(error);
          this.error.set(message);
          this.notify.error('La venta no se registró', message);
        },
      });
  }
}
