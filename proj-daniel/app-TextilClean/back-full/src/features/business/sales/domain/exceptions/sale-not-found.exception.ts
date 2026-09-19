import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception.js';

export class SaleNotFoundException extends EntityNotFoundException {
  constructor(id: number) {
    super(`Venta con id ${id} no encontrada`);
  }
}
