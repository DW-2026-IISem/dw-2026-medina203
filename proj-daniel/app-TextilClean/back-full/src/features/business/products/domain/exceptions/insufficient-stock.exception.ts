import { BusinessRuleException } from '../../../../../common/exceptions/business-rule.exception.js';

export class InsufficientStockException extends BusinessRuleException {
  constructor(productId: number | null, available: number, requested: number) {
    super(
      `Stock insuficiente para el producto ${productId ?? '(nuevo)'}: disponible ${available}, solicitado ${requested}`,
    );
  }
}
