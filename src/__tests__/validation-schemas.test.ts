import { jangadaSchema, jangadaCreateSchema, jangadaUpdateSchema, navioSchema } from '../lib/validation-schemas';

describe('validation-schemas', () => {
  describe('jangadaSchema', () => {
    it('valida um objeto válido', () => {
      const valid = {
        numeroSerie: 'ABC-123',
        marca: 'MarcaX',
        modelo: 'ModeloY',
        lotacao: 10,
        tipoPack: 'Pack1',
        dataFabrico: '2024-01-01',
        estadoAtual: 'Em Stock',
        delegacao: 'Norte',
        proximaInspecao: '2026-01-30',
      };
      expect(() => jangadaSchema.parse(valid)).not.toThrow();
    });
    it('rejeita número de série inválido', () => {
      const invalid = {
        numeroSerie: 'abc-123',
        marca: 'M',
        modelo: 'M',
        lotacao: 1,
        tipoPack: 'P',
        dataFabrico: '2024-01-01',
        estadoAtual: 'Em Stock',
        delegacao: 'Norte',
      };
      expect(() => jangadaSchema.parse(invalid)).toThrow();
    });
    it('rejeita data de fabrico no futuro', () => {
      const future = {
        numeroSerie: 'ABC-123',
        marca: 'M',
        modelo: 'M',
        lotacao: 1,
        tipoPack: 'P',
        dataFabrico: '2027-01-01',
        estadoAtual: 'Em Stock',
        delegacao: 'Norte',
      };
      expect(() => jangadaSchema.parse(future)).toThrow();
    });
  });

  describe('jangadaCreateSchema', () => {
    it('valida um objeto mínimo', () => {
      const valid = {
        numeroSerie: 'A', marca: 'B', modelo: 'C', lotacao: 1, tipoPack: 'P', dataFabrico: '2024-01-01', estadoAtual: 'Em Stock', delegacao: 'Norte'
      };
      expect(() => jangadaCreateSchema.parse(valid)).not.toThrow();
    });
    it('rejeita lotação zero', () => {
      const invalid = {
        numeroSerie: 'A',
        marca: 'B',
        modelo: 'C',
        lotacao: 0,
        tipoPack: 'P',
        dataFabrico: '2024-01-01',
        estadoAtual: 'Em Stock',
        delegacao: 'Norte',
      };
      expect(() => jangadaCreateSchema.parse(invalid)).toThrow();
    });
  });

  describe('navioSchema', () => {
    it('valida nome obrigatório', () => {
      const valid = {
        nome: 'NavioX',
        tipo: 'Cargueiro',
        delegacao: 'Norte',
      };
      expect(() => navioSchema.parse(valid)).not.toThrow();
    });
    it('rejeita nome vazio', () => {
      const invalid = {
        nome: '',
        tipo: 'Cargueiro',
        delegacao: 'Norte',
      };
      expect(() => navioSchema.parse(invalid)).toThrow();
    });
  });
});
