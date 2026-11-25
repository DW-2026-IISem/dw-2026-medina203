import { Customer, CustomerI } from "../customer.model";

/** Respuesta HTTP de un cliente. `customers` no tiene campos internos que ocultar. */
export type CustomerResponseDto = CustomerI;

export function toCustomerResponse(customer: Customer): CustomerResponseDto {
  return customer.toJSON() as CustomerResponseDto;
}
