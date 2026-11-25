import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ServiceOrder } from '../../../core/models/service-order.model';
import { CopPipe } from '../../../shared/pipes/cop.pipe';
import { ProcessStatusTag } from '../../../shared/ui/process-status-tag/process-status-tag';

/**
 * Detalle presentacional de una orden: cabecera, líneas activas y totales.
 * Recibe la orden de `GET /api/ordenes/:id` (ya incluye cliente y líneas).
 */
@Component({
  host: { class: 'block' },
  selector: 'app-service-order-detail',
  imports: [CopPipe, DatePipe, ProcessStatusTag, TableModule],
  templateUrl: './service-order-detail.html',
})
export class ServiceOrderDetail {
  readonly order = input.required<ServiceOrder>();
}
