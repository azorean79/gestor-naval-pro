import { cn, formatCurrency, formatDate, formatDateTime, generateId, debounce } from '../lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('a', 'b')).toBe('a b');
      expect(cn('a', false && 'b', 'c')).toBe('a c');
    });
  });

  describe('formatCurrency', () => {
    it('should format number as EUR currency', () => {
      const result = formatCurrency(1234.56);
      // Aceita ambos formatos: com ou sem separador de milhar
      expect([
        '1\u00a0234,56\u00a0€', // formato com separador de milhar
        '1234,56\u00a0€',         // formato sem separador
        '1 234,56 €',              // literal, pode variar
        '1234,56 €'                // literal, pode variar
      ]).toContain(result);
    });
  });

  describe('formatDate', () => {
    it('should format date as dd/mm/yyyy', () => {
      expect(formatDate('2024-01-31')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      expect(formatDateTime('2024-01-31T15:30:00')).toMatch(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}/);
    });
  });

  describe('generateId', () => {
    it('should generate a random id', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      let count = 0;
      const fn = debounce(() => { count++; }, 50);
      fn(); fn(); fn();
      setTimeout(() => {
        expect(count).toBe(1);
        done();
      }, 100);
    });
  });
});
