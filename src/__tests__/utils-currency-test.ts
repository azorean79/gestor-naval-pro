import { formatCurrency } from '../lib/utils';
console.log(formatCurrency(1234.56));
import { formatCurrency } from '../lib/utils';

describe('formatCurrency', () => {
	it('formata corretamente um número', () => {
		expect(formatCurrency(1234.56)).toMatch(/1234,56\s?€|1.234,56\s?€|1,234.56\s?€/);
	});
});
