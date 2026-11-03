import { Money, Status, Timestamps } from './api.model';

/**
 * Tabla `sales` — /api/ventas.
 * El repositorio NO incluye el detalle: `GET /api/ventas` devuelve la venta
 * sin `items`. El detalle se consulta con `GET /api/detalle-ventas`.
 */
export interface Sale extends Timestamps {
  id: number;
  sale_date: string;
  subtotal: Money;
  tax: Money;
  discounts: Money;
  total: Money;
  client_id: number;
  status: Status;
}

export interface SaleItemInput {
  product_id: number;
  quantity: number;
}

/** POST /api/ventas — CreateSaleDto. El stock se descuenta en el backend. */
export interface SaleCreatePayload {
  client_id: number;
  tax?: number;
  discounts?: number;
  sale_date?: string | Date;
  items: SaleItemInput[];
}

/**
 * PUT/PATCH /api/ventas/:id — UpdateSaleDto.
 * `client_id` queda fuera: el backend lo ignora en la actualización.
 */
export interface SaleUpdatePayload {
  sale_date?: string | Date;
  tax?: number;
  discounts?: number;
}
