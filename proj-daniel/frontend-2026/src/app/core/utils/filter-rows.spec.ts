import { filterRows } from './filter-rows';

const ROWS = [
  { nombre: 'Tienda Sur', email: 'sur@x.com', phone: null as string | null },
  { nombre: 'Bodega Norte', email: 'norte@x.com', phone: '3001234567' },
  { nombre: 'Kiosco Centro', email: null as string | null, phone: null as string | null },
];

const pick = (row: typeof ROWS[number]) => [row.nombre, row.email, row.phone];

describe('filterRows', () => {
  it('returns a copy when query is empty', () => {
    const out = filterRows(ROWS, '', pick);
    expect(out).toEqual(ROWS);
    expect(out).not.toBe(ROWS);
  });

  it('ignores surrounding whitespace and case', () => {
    expect(filterRows(ROWS, '  SUR  ', pick).map((r) => r.nombre)).toEqual([
      'Tienda Sur',
    ]);
  });

  it('matches by email', () => {
    expect(filterRows(ROWS, 'norte@', pick)).toHaveLength(1);
  });

  it('handles null fields without throwing', () => {
    expect(filterRows(ROWS, 'centro', pick)).toHaveLength(1);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterRows(ROWS, 'zzz', pick)).toEqual([]);
  });
});
