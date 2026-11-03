import { Money, Status, Timestamps } from './api.model';

/** Tabla `product_sales` — /api/detalle-ventas */
export interface ProductSale extends Timestamps {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: Money;
  line_total: Money;
  status: Status;
}

/** POST /api/detalle-ventas — CreateProductSaleDto. El precio lo fija el backend. */
export interface ProductSaleCreatePayload {
  sale_id: number;
  product_id: number;
  quantity: number;
}

/** PATCH /api/detalle-ventas/:id — UpdateProductSaleDto: sólo `quantity`. */
export interface ProductSaleUpdatePayload {
  quantity: number;
}

/**
 * Payload que emite `ProductSaleForm` (ISS-07). En edición solo se envía
 * `{ quantity }`; el estado lo gobierna /deactivate.
 */
export interface ProductSalePayload {
  sale_id: number;
  product_id: number;
  quantity: number;
  status?: Status;
}
