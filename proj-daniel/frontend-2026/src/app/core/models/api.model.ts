/** Estado de borrado lógico, común a todas las tablas del backend. */
export type Status = 'active' | 'inactive';

/** Los DECIMAL de MySQL pueden llegar como number o string: se normalizan con `toNumber()`. */
export type Money = number | string;

/** Cuerpo de error de Express: `{ error, detail? }`. */
export interface ApiError {
  error: string;
  detail?: string;
}

/** Marcas de tiempo de Sequelize (`timestamps: true`). */
export interface Timestamps {
  createdAt?: string;
  updatedAt?: string;
}
