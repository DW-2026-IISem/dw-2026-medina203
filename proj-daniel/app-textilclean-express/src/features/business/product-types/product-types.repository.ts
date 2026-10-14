import { CreationAttributes } from "sequelize";
import { ProductType, ProductTypeI } from "./product-type.model";

/**
 * Capa Repository del feature ProductTypes.
 *
 * Única responsable de hablar con Sequelize (el modelo `ProductType`).
 */
export class ProductTypesRepository {
  /** Todos los tipos activos. */
  public async findAllActive(): Promise<ProductType[]> {
    return ProductType.findAll({ where: { status: "active" } });
  }

  /** Un tipo por PK (o `null`). */
  public async findById(id: number): Promise<ProductType | null> {
    return ProductType.findByPk(id);
  }

  /** Inserta un tipo de producto. */
  public async create(data: CreationAttributes<ProductType>): Promise<ProductType> {
    return ProductType.create(data);
  }

  /** Persiste cambios sobre una instancia existente. */
  public async update(
    productType: ProductType,
    data: Partial<ProductTypeI>
  ): Promise<ProductType> {
    return productType.update(data);
  }

  /** Elimina físicamente una instancia. */
  public async delete(productType: ProductType): Promise<void> {
    await productType.destroy();
  }
}
