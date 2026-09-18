import { BusinessRuleException } from '../../../../../common/exceptions/business-rule.exception.js';

export class ClientEmailAlreadyExistsException extends BusinessRuleException {
  constructor(email: string) {
    super(`Ya existe un cliente con el email ${email}`);
  }
}
