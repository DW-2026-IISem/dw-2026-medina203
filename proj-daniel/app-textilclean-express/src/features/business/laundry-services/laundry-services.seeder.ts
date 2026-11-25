import { fakerES_MX as faker } from "@faker-js/faker";
import { GarmentType } from "../garment-types/garment-type.model";
import { BillingUnit, LaundryService } from "./laundry-service.model";

/** Plantillas de servicio: nombre, unidad de cobro, rango de precio (COP) y horas. */
const SERVICE_TEMPLATES: ReadonlyArray<{
  name: string;
  billing_unit: BillingUnit;
  min: number;
  max: number;
  hours: number;
}> = [
  { name: "Lavado y secado", billing_unit: "kg", min: 4500, max: 7000, hours: 24 },
  { name: "Lavado con desinfección", billing_unit: "kg", min: 6500, max: 9500, hours: 36 },
  { name: "Planchado", billing_unit: "unit", min: 1500, max: 4000, hours: 12 },
  { name: "Desmanchado", billing_unit: "unit", min: 3000, max: 8000, hours: 48 },
  { name: "Lavado en seco", billing_unit: "unit", min: 9000, max: 18000, hours: 72 },
];

/**
 * Seeder de LaundryServices: combina tipos de prenda activos con plantillas
 * (ej. "Lavado y secado - Sábanas"). Precios redondeados a centenas. Idempotente.
 */
export async function seedLaundryServices(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️  laundry_services: count=0, se omite");
    return 0;
  }
  const existing = await LaundryService.count();
  if (existing > 0) {
    console.log(`⏭️  laundry_services: ya hay ${existing} registro(s), se omite`);
    return 0;
  }
  const garmentTypes = await GarmentType.findAll({ where: { status: "active" }, order: [["id", "ASC"]] });
  if (garmentTypes.length === 0) {
    console.log("⏭️  laundry_services: no hay tipos de prenda activos");
    return 0;
  }

  const combos = garmentTypes.flatMap((garmentType) =>
    SERVICE_TEMPLATES.map((template) => ({ garmentType, template }))
  );
  const rows = faker.helpers.shuffle(combos).slice(0, count).map(({ garmentType, template }) => ({
    name: `${template.name} - ${garmentType.name}`,
    description: `${template.name} de ${garmentType.name.toLowerCase()}`,
    price: Math.round(faker.number.int({ min: template.min, max: template.max }) / 100) * 100,
    billing_unit: template.billing_unit,
    estimated_hours: template.hours,
    garment_type_id: garmentType.id,
    status: "active" as const,
  }));

  await LaundryService.bulkCreate(rows);
  console.log(`✅ laundry_services: ${rows.length} registro(s) insertados`);
  return rows.length;
}
