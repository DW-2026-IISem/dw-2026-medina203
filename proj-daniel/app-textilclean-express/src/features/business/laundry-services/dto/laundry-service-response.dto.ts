import { LaundryService, LaundryServiceI } from "../laundry-service.model";

/** Respuesta: el servicio y, cuando se carga, su tipo de prenda resumido. */
export type LaundryServiceResponseDto = LaundryServiceI & {
  garment_type?: { id: number; name: string };
};

export function toLaundryServiceResponse(service: LaundryService): LaundryServiceResponseDto {
  const json = service.toJSON() as LaundryServiceResponseDto;
  // DECIMAL llega como string desde MySQL: se expone como número.
  return { ...json, price: Number(json.price) };
}
