import { GarmentType } from "./garment-type.model";

/** Catálogo base de prendas que procesa una lavandería industrial. */
export const GARMENT_TYPE_CATALOG = [
  { name: "Sábanas", description: "Sábanas de cama sencilla, doble y king" },
  { name: "Fundas de almohada", description: "Fundas de almohada y cojín" },
  { name: "Toallas", description: "Toallas de baño, mano y piscina" },
  { name: "Batas de baño", description: "Batas de baño de hotel y spa" },
  { name: "Manteles", description: "Manteles de restaurante y eventos" },
  { name: "Servilletas", description: "Servilletas de tela" },
  { name: "Uniformes", description: "Uniformes de personal operativo y cocina" },
  { name: "Batas médicas", description: "Batas y pijamas quirúrgicas" },
  { name: "Cortinas", description: "Cortinas y visillos" },
  { name: "Cobijas", description: "Cobijas, edredones y cubrelechos" },
] as const;

/**
 * Seeder de GarmentTypes: catálogo determinista (no aleatorio).
 * `count` limita cuántos elementos del catálogo se insertan. Idempotente.
 */
export async function seedGarmentTypes(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️  garment_types: count=0, se omite");
    return 0;
  }
  const existing = await GarmentType.count();
  if (existing > 0) {
    console.log(`⏭️  garment_types: ya hay ${existing} registro(s), se omite`);
    return 0;
  }
  const rows = GARMENT_TYPE_CATALOG.slice(0, count).map((item) => ({ ...item, status: "active" as const }));
  await GarmentType.bulkCreate(rows);
  console.log(`✅ garment_types: ${rows.length} registro(s) insertados`);
  return rows.length;
}
