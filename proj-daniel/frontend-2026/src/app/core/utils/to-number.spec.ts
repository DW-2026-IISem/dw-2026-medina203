import { toNumber } from './to-number';

describe('toNumber', () => {
  it('convierte el DECIMAL que MySQL envía como string', () => {
    expect(toNumber('5500.00')).toBe(5500);
  });

  it('deja los números como están', () => {
    expect(toNumber(12.5)).toBe(12.5);
  });

  it('devuelve 0 para null, undefined o texto inválido', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('abc')).toBe(0);
  });
});
