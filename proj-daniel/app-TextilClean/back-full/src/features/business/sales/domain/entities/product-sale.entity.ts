export interface ProductSaleProps {
  id?: number | null;
  saleId?: number | null;
  productId: number;
  quantity: number;
  unitPrice: number;
  total: number;
}

export class ProductSale {
  readonly id: number | null;
  readonly saleId: number | null;
  readonly productId: number;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly total: number;

  constructor(props: ProductSaleProps) {
    this.id = props.id ?? null;
    this.saleId = props.saleId ?? null;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
    this.total = props.total;
  }
}
