import { DomainException } from '../../../../../common/exceptions/domain.exception.js';

export class EmptySaleException extends DomainException {
  constructor() {
    super('La venta debe tener al menos un ítem');
  }
}
