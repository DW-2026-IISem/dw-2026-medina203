import { GarmentType, GarmentTypeI } from "../garment-type.model";

export type GarmentTypeResponseDto = GarmentTypeI;

export function toGarmentTypeResponse(garmentType: GarmentType): GarmentTypeResponseDto {
  return garmentType.toJSON() as GarmentTypeResponseDto;
}
