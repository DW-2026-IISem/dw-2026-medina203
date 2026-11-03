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
  /**
   * Líneas de la venta. El backend actual **no** las incluye en
   * `GET /api/ventas`; queda opcional por si se añade el `include`.
   * El detalle real se consulta en `/api/detalle-ventas` (ISS-07).
   */
  items?: SaleItem[];
}

/** Línea de venta (tabla `product_sales`) tal como llega dentro de una venta. */
export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: Money;
  line_total: Money;
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
