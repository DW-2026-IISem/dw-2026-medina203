import { ProductType, ProductTypeI } from "../product-type.model";

/**
 * Respuesta HTTP de un tipo de producto.
 *
 * Regla del DTO de respuesta: la API expone **sólo** lo que declara este tipo.
 * `ProductType` no guarda campos internos, por eso el contrato coincide hoy con
 * el modelo. Si mañana aparece uno, la proyección se vuelve explícita aquí
 * (`Omit<ProductTypeI, "...">`) y el mapper lo omite.
 */
export type ProductTypeResponseDto = ProductTypeI;

/** Mapper modelo -> DTO de respuesta (objeto plano, sin métodos de Sequelize). */
export function toProductTypeResponse(productType: ProductType): ProductTypeResponseDto {
  return productType.toJSON() as ProductTypeResponseDto;
}
