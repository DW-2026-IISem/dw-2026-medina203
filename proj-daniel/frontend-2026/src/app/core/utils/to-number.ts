import { Money } from '../models/api.model';

/**
 * Normaliza un DECIMAL (`number | string | null`) a `number`.
 *
 * El backend puede devolver `"12.50"` en lugar de `12.5`. Sumar strings
 * produce `"012.5015.00"`; este helper evita esa trampa.
 */
export function toNumber(value: Money | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return typeof value === 'number' ? value : Number.parseFloat(value) || 0;
}
