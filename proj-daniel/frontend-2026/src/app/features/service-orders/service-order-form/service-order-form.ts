import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import { LaundryService } from '../../../core/models/laundry-service.model';
import { ServiceOrderLineInput } from '../../../core/models/service-order.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { toNumber } from '../../../core/utils/to-number';
import { CopPipe } from '../../../shared/pipes/cop.pipe';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CustomerApi } from '../../customers/customer-api';
import { LaundryServiceApi } from '../../laundry-services/laundry-service-api';
import { ServiceOrderApi } from '../service-order-api';

/** Línea del borrador: igual a lo que se envía al backend. */
export interface DraftLine {
  laundry_service_id: number;
  quantity: number;
  weight_kg: number | null;
}

/**
 * Registro de una orden de servicio (transaccional).
 *
 * El borrador vive en signals; los totales se recalculan con `computed()` con
 * la misma regla del backend: por kg → precio × peso; por unidad → precio ×
 * cantidad. Al confirmar se hace UN `POST /api/ordenes` con todas las líneas:
 * el backend congela precios y guarda orden + líneas en una transacción.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-service-order-form',
  imports: [
    ButtonModule,
    CardModule,
    CopPipe,
    DatePipe,
    FormsModule,
    InputNumberModule,
    MessageModule,
    PageHeader,
    SelectModule,
    TableModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './service-order-form.html',
  styleUrl: './service-order-form.css',
})
export class ServiceOrderForm {
  private readonly api = inject(ServiceOrderApi);
  private readonly customersApi = inject(CustomerApi);
  private readonly servicesApi = inject(LaundryServiceApi);
  private readonly notify = inject(NotificationService);
  protected readonly router = inject(Router);

  readonly customers = signal<Customer[]>([]);
  readonly services = signal<LaundryService[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  // Cabecera
  readonly customerId = signal<number | null>(null);
  readonly notes = signal('');
  readonly tax = signal(0);
  readonly discount = signal(0);

  // Línea en edición
  readonly selectedServiceId = signal<number | null>(null);
  readonly quantity = signal(1);
  readonly weightKg = signal<number | null>(null);

  readonly lines = signal<DraftLine[]>([]);

  readonly serviceById = computed(() => new Map(this.services().map((s) => [s.id, s])));

  readonly selectedService = computed(() => {
    const id = this.selectedServiceId();
    return id === null ? null : (this.serviceById().get(id) ?? null);
  });

  /** ¿La línea en edición requiere peso? */
  readonly needsWeight = computed(() => this.selectedService()?.billing_unit === 'kg');

  readonly subtotal = computed(() =>
    this.lines().reduce((sum, line) => sum + this.lineTotal(line), 0),
  );

  readonly total = computed(
    () => this.subtotal() + Number(this.tax() ?? 0) - Number(this.discount() ?? 0),
  );

  /** Fecha estimada: ahora + el mayor tiempo de entrega de los servicios elegidos. */
  readonly estimatedDelivery = computed(() => {
    const hours = Math.max(
      0,
      ...this.lines().map(
        (l) => this.serviceById().get(l.laundry_service_id)?.estimated_hours ?? 0,
      ),
    );
    return hours > 0 ? new Date(Date.now() + hours * 3600 * 1000) : null;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ customers: this.customersApi.list(), services: this.servicesApi.list() }).subscribe({
      next: ({ customers, services }) => {
        this.customers.set(customers);
        this.services.set(services);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  /** Misma fórmula que el backend (`order-line.ts`). */
  lineTotal(line: DraftLine): number {
    const service = this.serviceById().get(line.laundry_service_id);
    if (!service) return 0;
    const base = service.billing_unit === 'kg' ? (line.weight_kg ?? 0) : line.quantity;
    return Math.round(toNumber(service.price) * base * 100) / 100;
  }

  addLine(): void {
    const service = this.selectedService();
    const quantity = Number(this.quantity());
    const weight = this.weightKg();
    this.error.set(null);

    if (!service) {
      this.error.set('Selecciona un servicio.');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      this.error.set('La cantidad de prendas debe ser un entero mayor o igual a 1.');
      return;
    }
    if (service.billing_unit === 'kg' && (weight === null || weight <= 0)) {
      this.error.set(`«${service.name}» se cobra por kg: escribe el peso.`);
      return;
    }

    this.lines.update((lines) => [
      ...lines,
      { laundry_service_id: service.id, quantity, weight_kg: weight && weight > 0 ? weight : null },
    ]);
    this.selectedServiceId.set(null);
    this.quantity.set(1);
    this.weightKg.set(null);
  }

  removeLine(index: number): void {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
  }

  save(): void {
    const customerId = this.customerId();
    if (customerId === null) {
      this.error.set('Selecciona el cliente que entrega la ropa.');
      return;
    }
    if (this.lines().length === 0) {
      this.error.set('La orden necesita al menos una línea.');
      return;
    }
    if (this.total() < 0) {
      this.error.set('El descuento no puede superar el subtotal más el impuesto.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const items: ServiceOrderLineInput[] = this.lines().map((line) => ({
      laundry_service_id: line.laundry_service_id,
      quantity: line.quantity,
      weight_kg: line.weight_kg,
    }));

    this.api
      .create({
        customer_id: customerId,
        notes: this.notes().trim() || null,
        tax: Number(this.tax() ?? 0),
        discount: Number(this.discount() ?? 0),
        items,
      })
      .subscribe({
        next: (order) => {
          this.saving.set(false);
          this.notify.success(
            `Orden #${order.id} registrada`,
            'Precios congelados y totales calculados.',
          );
          void this.router.navigate(['/ordenes']);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          const message = toApiMessage(error);
          this.error.set(message);
          this.notify.error('La orden no se registró', message);
        },
      });
  }
}
