import { Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { LaundryService } from '../../../core/models/laundry-service.model';
import { ServiceOrder } from '../../../core/models/service-order.model';
import {
  ServiceOrderItem,
  ServiceOrderItemCreatePayload,
} from '../../../core/models/service-order-item.model';
import { toNumber } from '../../../core/utils/to-number';

/**
 * Formulario de línea de orden.
 *
 * - Crear: orden abierta + servicio + prendas + peso → `POST /api/detalle-ordenes`.
 * - Editar: solo prendas y peso (el servicio y el precio congelado no cambian).
 */
@Component({
  host: { class: 'block' },
  selector: 'app-service-order-item-form',
  imports: [ButtonModule, InputNumberModule, MessageModule, ReactiveFormsModule, SelectModule],
  templateUrl: './service-order-item-form.html',
})
export class ServiceOrderItemForm {
  readonly item = input<ServiceOrderItem | null>(null);
  /** Órdenes que aún admiten cambios (no entregadas). */
  readonly orders = input<ServiceOrder[]>([]);
  readonly services = input<LaundryService[]>([]);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<ServiceOrderItemCreatePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    service_order_id: this.fb.control<number | null>(null, Validators.required),
    laundry_service_id: this.fb.control<number | null>(null, Validators.required),
    quantity: [1, [Validators.required, Validators.min(1)]],
    weight_kg: this.fb.control<number | null>(null),
  });

  readonly orderOptions = computed(() =>
    this.orders().map((o) => ({
      id: o.id,
      label: `#${o.id} · ${o.customer?.business_name ?? 'Cliente #' + o.customer_id}`,
    })),
  );

  private readonly serviceId = toSignal(this.form.controls.laundry_service_id.valueChanges, {
    initialValue: null,
  });

  /** Unidad de cobro de la línea: del servicio elegido o de la línea en edición. */
  readonly billingUnit = computed(() => {
    const editing = this.item();
    if (editing) return editing.laundry_service?.billing_unit ?? 'unit';
    return this.services().find((s) => s.id === this.serviceId())?.billing_unit ?? null;
  });

  constructor() {
    effect(() => {
      const current = this.item();
      this.resetKey();
      this.form.reset({
        service_order_id: current?.service_order_id ?? null,
        laundry_service_id: current?.laundry_service_id ?? null,
        quantity: current?.quantity ?? 1,
        weight_kg: current?.weight_kg != null ? toNumber(current.weight_kg) : null,
      });
      if (current) {
        this.form.controls.service_order_id.disable();
        this.form.controls.laundry_service_id.disable();
      } else {
        this.form.controls.service_order_id.enable();
        this.form.controls.laundry_service_id.enable();
      }
    });
  }

  submit(): void {
    const value = this.form.getRawValue();
    const weight = value.weight_kg;
    if (this.form.invalid || (this.billingUnit() === 'kg' && !(weight && weight > 0))) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit({
      service_order_id: value.service_order_id as number,
      laundry_service_id: value.laundry_service_id as number,
      quantity: Number(value.quantity),
      weight_kg: weight && weight > 0 ? weight : null,
    });
  }
}
