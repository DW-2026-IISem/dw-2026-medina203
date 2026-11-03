/**
 * Filtro local reutilizable para tablas PrimeNG 22.
 *
 * PrimeNG 22 eliminó el input `globalFilter` de `p-table`, así que filtramos el
 * arreglo **antes** de entregarlo a `[value]`. Es una función pura: no depende
 * del DOM, de la tabla ni de Angular, y por eso se prueba sin montar nada.
 */
export function filterRows<T>(
  rows: readonly T[],
  query: string,
  pick: (row: T) => Array<string | number | null | undefined>,
): T[] {
  const term = query.trim().toLowerCase();

  if (!term) {
    return [...rows];
  }

  return rows.filter((row) =>
    pick(row).some((value) => (value ?? '').toString().toLowerCase().includes(term)),
  );
}
