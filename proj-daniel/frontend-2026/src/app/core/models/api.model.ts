export type Status = 'active' | 'inactive';
export type Money = number | string;

export interface ApiError {
  error: string;
  detail?: string;
}

/** Firma mínima de los objetos Sequelize que devuelve el backend. */
export interface Timestamps {
  createdAt?: string;
  updatedAt?: string;
}

/** DECIMAL puede llegar como number o como string: se normaliza aquí. */
export function toNumber(value: Money | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
