import { Money, Status, Timestamps } from './api.model';

/** Tabla `products` — /api/productos */
export interface Product extends Timestamps {
  id: number;
  name: string;
  brand: string;
  price: Money;
  min_stock: number;
  quantity: number;
  product_type_id: number;
  status: Status;
}

/** POST /api/productos — CreateProductDto. */
export interface ProductCreatePayload {
  name: string;
  brand: string;
  price: number;
  min_stock: number;
  quantity: number;
  product_type_id: number;
  status?: Status;
}

/** PUT/PATCH /api/productos/:id — UpdateProductDto: sin `status`. */
export interface ProductUpdatePayload {
  name: string;
  brand: string;
  price: number;
  min_stock: number;
  quantity: number;
  product_type_id: number;
}
