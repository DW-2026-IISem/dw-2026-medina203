/**
 * Copia de `body` solo las claves permitidas que vienen definidas.
 *
 * Protege contra *mass assignment*: en un PATCH no basta con que el DTO de
 * TypeScript excluya `status` o `id`, porque en tiempo de ejecución el body
 * llega tal cual. Esta función filtra de verdad.
 */
export function pickFields<T extends object, K extends keyof T>(
  body: unknown,
  allowed: readonly K[]
): Partial<Pick<T, K>> {
  const source = (body ?? {}) as Record<string, unknown>;
  const result: Partial<Pick<T, K>> = {};
  for (const key of allowed) {
    if (source[key as string] !== undefined) {
      (result as Record<string, unknown>)[key as string] = source[key as string];
    }
  }
  return result;
}
