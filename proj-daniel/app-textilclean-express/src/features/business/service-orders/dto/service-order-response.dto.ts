import { ServiceOrder, ServiceOrderI } from "../service-order.model";

export interface ServiceOrderItemSummary {
  id: number;
  laundry_service_id: number;
  quantity: number;
  weight_kg: number | null;
  unit_price: number;
  line_total: number;
  laundry_service?: { id: number; name: string; billing_unit: string };
}

/** Respuesta de una orden: datos, cliente resumido y (en el detalle) sus líneas activas. */
export type ServiceOrderResponseDto = ServiceOrderI & {
  customer?: { id: number; business_name: string; tax_id: string };
  items?: ServiceOrderItemSummary[];
};

/** Convierte los DECIMAL (string en MySQL) a número. */
export function toServiceOrderResponse(order: ServiceOrder): ServiceOrderResponseDto {
  const json = order.toJSON() as ServiceOrderResponseDto;
  const response: ServiceOrderResponseDto = {
    ...json,
    subtotal: Number(json.subtotal),
    tax: Number(json.tax),
    discount: Number(json.discount),
    total: Number(json.total),
  };
  if (json.items) {
    response.items = json.items.map((item) => ({
      id: item.id,
      laundry_service_id: item.laundry_service_id,
      quantity: item.quantity,
      weight_kg: item.weight_kg === null ? null : Number(item.weight_kg),
      unit_price: Number(item.unit_price),
      line_total: Number(item.line_total),
      laundry_service: item.laundry_service,
    }));
  }
  return response;
}
