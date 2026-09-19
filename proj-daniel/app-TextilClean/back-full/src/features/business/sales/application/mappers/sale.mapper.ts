import { Sale } from '../../domain/entities/sale.entity.js';

export class SaleMapper {
  static toResponse(sale: Sale) {
    return {
      id: sale.id,
      saleDate: sale.saleDate,
      subtotal: sale.subtotal,
      tax: sale.tax,
      discounts: sale.discounts,
      total: sale.total,
      status: sale.status,
      clientId: sale.clientId,
      items: sale.items.map((i) => ({
        id: i.id,
        saleId: i.saleId,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
      })),
    };
  }
}
