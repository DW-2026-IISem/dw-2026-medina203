/**
 * Cantidad de registros por feature/entidad.
 * Prioridad: CLI (--clients=N) > env (SEED_CLIENTS) > default de este archivo.
 *
 * Cuando agregues features, suma aquí la clave y léela en el runner.
 */
export type SeedCounts = {
  clients: number;
  // users?: number;
  // roles?: number;
  // products?: number;
};

export const DEFAULT_SEED_COUNTS: SeedCounts = {
  clients: 10,
};

export function resolveSeedCounts(argv: string[] = process.argv.slice(2)): SeedCounts {
  const counts: SeedCounts = { ...DEFAULT_SEED_COUNTS };

  const envClients = process.env.SEED_CLIENTS;
  if (envClients !== undefined && envClients !== "") {
    counts.clients = Number(envClients);
  }

  for (const arg of argv) {
    const m = arg.match(/^--([a-zA-Z_]+)=(\d+)$/);
    if (!m) continue;
    const key = m[1] as keyof SeedCounts;
    const value = Number(m[2]);
    if (key in counts) {
      counts[key] = value;
    }
  }

  return counts;
}
