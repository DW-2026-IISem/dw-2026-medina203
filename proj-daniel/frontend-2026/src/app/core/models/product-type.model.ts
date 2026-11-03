import { Status, Timestamps } from './api.model';

/** Tabla `product_types` — /api/tipos-producto */
export interface ProductType extends Timestamps {
  id: number;
  name: string;
  description: string | null;
  status: Status;
}

/** POST /api/tipos-producto — CreateProductTypeDto. */
export interface ProductTypeCreatePayload {
  name: string;
  description?: string | null;
  status?: Status;
}

/** PUT/PATCH /api/tipos-producto/:id — UpdateProductTypeDto: sin `status`. */
export interface ProductTypeUpdatePayload {
  name: string;
  description?: string | null;
}
