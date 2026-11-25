import { ServiceOrderItem, ServiceOrderItemI } from "../service-order-item.model";

export type ServiceOrderItemResponseDto = ServiceOrderItemI & {
  laundry_service?: { id: number; name: string; billing_unit: string };
};

/** Convierte los DECIMAL (string en MySQL) a número. */
export function toServiceOrderItemResponse(item: ServiceOrderItem): ServiceOrderItemResponseDto {
  const json = item.toJSON() as ServiceOrderItemResponseDto;
  return {
    ...json,
    weight_kg: json.weight_kg === null ? null : Number(json.weight_kg),
    unit_price: Number(json.unit_price),
    line_total: Number(json.line_total),
  };
}
