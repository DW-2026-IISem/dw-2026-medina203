export type ProductTypeStatus = 'active' | 'inactive';

export interface ProductTypeProps {
  id?: number | null;
  name: string;
  description?: string | null;
  status?: ProductTypeStatus;
}

export class ProductType {
  readonly id: number | null;
  readonly name: string;
  readonly description: string | null;
  readonly status: ProductTypeStatus;

  constructor(props: ProductTypeProps) {
    this.id = props.id ?? null;
    this.name = props.name;
    this.description = props.description ?? null;
    this.status = props.status ?? 'active';
  }
}
