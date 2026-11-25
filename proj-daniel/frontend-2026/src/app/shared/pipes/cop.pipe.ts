import { Pipe, PipeTransform } from '@angular/core';
import { Money } from '../../core/models/api.model';
import { toNumber } from '../../core/utils/to-number';

const FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/**
 * Formatea un valor en pesos colombianos: `5500` → `$ 5.500`.
 * Acepta los DECIMAL que llegan como string desde MySQL.
 */
@Pipe({ name: 'cop' })
export class CopPipe implements PipeTransform {
  transform(value: Money | null | undefined): string {
    return FORMATTER.format(toNumber(value)).replace(/ /g, ' ');
  }
}
