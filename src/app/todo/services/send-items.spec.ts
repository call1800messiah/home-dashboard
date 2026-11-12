import { isCloseName, normalizeName, splitQuantity } from './send-items';

describe('splitQuantity', () => {
  const cases: [string, string, string | undefined][] = [
    ['Banane 10', 'Banane', '10'],
    ['Sellerie 225g', 'Sellerie', '225g'],
    ['Ingwer 10 g', 'Ingwer', '10 g'],
    ['Kartoffeln 1,5kg', 'Kartoffeln', '1,5kg'],
    ['Kürbis max 1.5kg', 'Kürbis', 'max 1.5kg'],
    ['Nektarinen ca. 4', 'Nektarinen', 'ca. 4'],
    ['Risotto Reis mind. 650 g', 'Risotto Reis', 'mind. 650 g'],
    ['Magerquark, mind. 500 g', 'Magerquark', 'mind. 500 g'],
    ['Spinat, 1000 g', 'Spinat', '1000 g'],
    ['Gläschen mit Fisch 2-3', 'Gläschen mit Fisch', '2-3'],
    ['Karotte 4 mittelgroße', 'Karotte', '4 mittelgroße'],
    ['Windeln 2 Coupon nutzen', 'Windeln', '2 Coupon nutzen'],
    ['CO2 Kartusche 2', 'CO2 Kartusche', '2'],
    ['Käse G 2', 'Käse G', '2'],
    ['Sweet Chili Sauce 200 g', 'Sweet Chili Sauce', '200 g'],
    ['Kleine Tomaten', 'Kleine Tomaten', undefined],
    ['6 - 8 Bodys', '6 - 8 Bodys', undefined],
    ['  milch   2l ', 'milch', '2l'],
  ];
  cases.forEach(([text, name, quantity]) => {
    it(`splits "${text}"`, () => {
      expect(splitQuantity(text)).toEqual(quantity === undefined ? { name } : { name, quantity });
    });
  });
});

describe('normalizeName', () => {
  it('ignores case and extra spaces', () => expect(normalizeName('  Passierte   Tomate ')).toBe('passierte tomate'));
  it('keeps umlauts', () => expect(normalizeName('Äpfel')).toBe('äpfel'));
});

describe('isCloseName', () => {
  it('matches one letter added', () => expect(isCloseName('tomate', 'tomaten')).toBeTrue());
  it('matches one letter in one word of several', () => expect(isCloseName('passierte tomate', 'passierte tomaten')).toBeTrue());
  it('matches one letter replaced', () => expect(isCloseName('banane', 'banana')).toBeTrue());
  it('rejects short words', () => expect(isCloseName('reis', 'eis')).toBeFalse());
  it('rejects a one-letter word', () => expect(isCloseName('käse g', 'käse t')).toBeFalse());
  it('rejects part of a word', () => expect(isCloseName('milch', 'hafermilch')).toBeFalse());
  it('rejects a different word count', () => expect(isCloseName('tee', 'tee für aurelio')).toBeFalse());
  it('rejects two differing words', () => expect(isCloseName('rote linse', 'roten linsen')).toBeFalse());
  it('rejects equal names', () => expect(isCloseName('milch', 'milch')).toBeFalse());
});
