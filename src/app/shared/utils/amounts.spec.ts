import { addAmounts, formatAmount, parseAmount } from './amounts';

describe('formatAmount', () => {
  it('drops trailing zeros', () => expect(formatAmount(250)).toBe('250'));
  it('uses a comma', () => expect(formatAmount(0.5)).toBe('0,5'));
  it('rounds to two decimals', () => expect(formatAmount(4 / 3)).toBe('1,33'));
  it('can use a dot', () => expect(formatAmount(1.7, '.')).toBe('1.7'));
});

describe('parseAmount', () => {
  it('reads number and unit', () => expect(parseAmount('500 g')).toEqual({ value: 500, unit: 'g', decimal: ',', spaced: true }));
  it('reads a comma decimal without space', () => expect(parseAmount('1,5kg')).toEqual({ value: 1.5, unit: 'kg', decimal: ',', spaced: false }));
  it('reads a dot decimal', () => expect(parseAmount('1.2 kg')?.decimal).toBe('.'));
  it('reads a bare number', () => expect(parseAmount('3')).toEqual({ value: 3, unit: '', decimal: ',', spaced: false }));
  ['2-3', 'ca. 4', '2 Coupon nutzen', 'viel'].forEach((text) =>
    it(`rejects "${text}"`, () => expect(parseAmount(text)).toBeUndefined()));
});

describe('addAmounts', () => {
  it('adds the same unit', () => expect(addAmounts('200 g', '500 g')).toBe('700 g'));
  it('keeps the target spacing', () => expect(addAmounts('200g', '500 g')).toBe('700g'));
  it('ignores unit case', () => expect(addAmounts('200G', '500 g')).toBe('700G'));
  it('converts g into kg', () => expect(addAmounts('1 kg', '500 g')).toBe('1,5 kg'));
  it('keeps the target dot', () => expect(addAmounts('1.2 kg', '500 g')).toBe('1.7 kg'));
  it('converts l into ml', () => expect(addAmounts('200 ml', '1 l')).toBe('1200 ml'));
  it('adds bare numbers', () => expect(addAmounts('2', '3')).toBe('5'));
  it('refuses different units', () => expect(addAmounts('2 Stück', '500 g')).toBeUndefined());
  it('refuses unreadable amounts', () => expect(addAmounts('2-3', '1')).toBeUndefined());
});
