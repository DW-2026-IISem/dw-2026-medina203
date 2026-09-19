import { BusinessRuleException } from '../../../../../common/exceptions/business-rule.exception.js';

export class ProductTypeInactiveException extends BusinessRuleException {
  constructor(typeId: number) {
    super(`El tipo de producto con id ${typeId} está inactivo`);
  }
}
