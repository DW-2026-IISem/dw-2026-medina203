import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Product } from '../../../core/models/product.model';
import { Sale } from '../../../core/models/sale.model';
import { toNumber } from '../../../core/utils/to-number';

@Component({
  host: { class: 'block' },
  selector: 'app-sale-detail',
  imports: [CurrencyPipe, DatePipe, TableModule, TagModule],
  templateUrl: './sale-detail.html',
  styleUrl: './sale-detail.css',
})
export class SaleDetail {
  readonly sale = input.required<Sale>();
  readonly products = input<Product[]>([]);

  readonly productName = computed(() => {
    const map = new Map(this.products().map((p) => [p.id, p.name]));
    return (id: number) => map.get(id) ?? `Producto #${id}`;
  });

  readonly itemCount = computed(() =>
    (this.sale().items ?? []).reduce((sum, item) => sum + item.quantity, 0),
  );

  readonly totalAsNumber = computed(() => toNumber(this.sale().total));
}
