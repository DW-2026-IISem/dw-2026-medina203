import { BusinessRuleException } from '../../../../../common/exceptions/business-rule.exception.js';

export class ProductTypeNameAlreadyExistsException extends BusinessRuleException {
  constructor(name: string) {
    super(`Ya existe un tipo de producto con el nombre ${name}`);
  }
}
