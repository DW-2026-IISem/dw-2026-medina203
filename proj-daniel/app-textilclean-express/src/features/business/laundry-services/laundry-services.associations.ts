import { GarmentType } from "../garment-types/garment-type.model";
import { LaundryService } from "./laundry-service.model";

/** Un servicio pertenece a un tipo de prenda; un tipo de prenda tiene muchos servicios. */
LaundryService.belongsTo(GarmentType, { foreignKey: "garment_type_id", as: "garment_type" });
GarmentType.hasMany(LaundryService, { foreignKey: "garment_type_id", as: "laundry_services" });
