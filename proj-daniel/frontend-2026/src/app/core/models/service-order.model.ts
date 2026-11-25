import { Money, Status, Timestamps } from './api.model';
import { ServiceOrderItem } from './service-order-item.model';

/** Avance de la orden en la planta. Solo avanza un paso hacia adelante. */
export type ProcessStatus = 'received' | 'in_process' | 'ready' | 'delivered';

export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
  received: 'Recibida',
  in_process: 'En proceso',
  ready: 'Lista',
  delivered: 'Entregada',
};

export const PROCESS_STATUS_SEVERITY: Record<
  ProcessStatus,
  'info' | 'warn' | 'success' | 'secondary'
> = {
  received: 'info',
  in_process: 'warn',
  ready: 'success',
  delivered: 'secondary',
};

/** Siguiente estado permitido (o `null` si ya fue entregada). */
export const NEXT_PROCESS_STATUS: Record<ProcessStatus, ProcessStatus | null> = {
  received: 'in_process',
  in_process: 'ready',
  ready: 'delivered',
  delivered: null,
};

/** Tabla `service_orders` — /api/ordenes. */
export interface ServiceOrder extends Timestamps {
  id: number;
  customer_id: number;
  received_at: string;
  delivery_date: string | null;
  process_status: ProcessStatus;
  notes: string | null;
  subtotal: Money;
  tax: Money;
  discount: Money;
  total: Money;
  status: Status;
  customer?: { id: number; business_name: string; tax_id: string };
  /** Solo en `GET /api/ordenes/:id`: líneas activas con su servicio. */
  items?: ServiceOrderItem[];
}

/** Línea enviada al crear la orden. */
export interface ServiceOrderLineInput {
  laundry_service_id: number;
  quantity: number;
  weight_kg?: number | null;
}

/** POST /api/ordenes: orden + líneas en una transacción. */
export interface ServiceOrderCreatePayload {
  customer_id: number;
  received_at?: string;
  delivery_date?: string | null;
  notes?: string | null;
  tax?: number;
  discount?: number;
  items: ServiceOrderLineInput[];
}

/** PUT/PATCH /api/ordenes/:id: datos de la orden (las líneas van por /detalle-ordenes). */
export interface ServiceOrderUpdatePayload {
  received_at?: string;
  delivery_date?: string | null;
  notes?: string | null;
  tax?: number;
  discount?: number;
}

/** Filtros de GET /api/ordenes. */
export interface ServiceOrderFilters {
  customer_id?: number;
  process_status?: ProcessStatus;
}
