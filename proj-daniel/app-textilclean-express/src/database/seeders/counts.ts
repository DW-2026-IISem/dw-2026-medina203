/**
 * Cantidad de registros por entidad para el SeedersRunner.
 * Prioridad: CLI (--customers=N) > env (SEED_CUSTOMERS) > default de este archivo.
 *
 * Al agregar un feature, suma su clave aquí (y su variable SEED_*).
 */
export type SeedCounts = {
  customers: number;
  garment_types: number;
  laundry_services: number;
  service_orders: number;
  service_order_items: number;
};

export const DEFAULT_SEED_COUNTS: SeedCounts = {
  customers: 10,
  garment_types: 10,
  laundry_services: 20,
  service_orders: 15,
  service_order_items: 10,
};

export function resolveSeedCounts(argv: string[] = process.argv.slice(2)): SeedCounts {
  const counts: SeedCounts = { ...DEFAULT_SEED_COUNTS };

  // env: SEED_<CLAVE EN MAYÚSCULAS>
  for (const key of Object.keys(counts) as (keyof SeedCounts)[]) {
    const raw = process.env[`SEED_${key.toUpperCase()}`];
    if (raw !== undefined && raw !== "" && /^\d+$/.test(raw)) counts[key] = Number(raw);
  }

  // CLI: --clave=N
  for (const arg of argv) {
    const m = arg.match(/^--([a-zA-Z_]+)=(\d+)$/);
    if (m && m[1] in counts) counts[m[1] as keyof SeedCounts] = Number(m[2]);
  }

  return counts;
}
