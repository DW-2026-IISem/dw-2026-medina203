import { CopPipe } from './cop.pipe';

describe('CopPipe', () => {
  const pipe = new CopPipe();

  it('formatea en pesos sin decimales y con punto de miles', () => {
    expect(pipe.transform(5500)).toMatch(/^\$\s?5\.500$/);
  });

  it('acepta el DECIMAL como string', () => {
    expect(pipe.transform('177500.00')).toMatch(/177\.500$/);
  });

  it('muestra $ 0 para null', () => {
    expect(pipe.transform(null)).toMatch(/0$/);
  });
});
