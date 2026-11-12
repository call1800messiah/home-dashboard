import type { TodoItem } from '../models/todo-item';
import { isCloseName, normalizeName, planSend, splitQuantity } from './send-items';

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

function item(id: string, content: string, done = false): TodoItem {
  return { id, author: 'a', content, created: new Date(0), done, edited: new Date(0), editedBy: 'a' };
}

describe('planSend', () => {
  it('reopens a ticked same-name item', () => {
    const plan = planSend([item('s1', 'Milch')], [item('t1', 'Milch', true)]);
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Milch', untick: true }]);
    expect(plan.summary.reopened).toEqual(['Milch']);
  });

  it('replaces the quantity and keeps the target name', () => {
    const plan = planSend([item('s1', 'Tomate 500g')], [item('t1', 'Tomaten 1kg', true)]);
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Tomaten 500g', untick: true }]);
    expect(plan.summary.closeMatches).toEqual(['Tomate → Tomaten']);
    expect(plan.summary.reopened).toEqual(['Tomaten 1kg → 500g']);
  });

  it('changes only the quantity of an open item', () => {
    const plan = planSend([item('s1', 'Milch 2l')], [item('t1', 'Milch 1l')]);
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Milch 2l', untick: false }]);
    expect(plan.summary.quantityChanged).toEqual(['Milch 1l → 2l']);
  });

  it('keeps the target quantity when the source has none', () => {
    const plan = planSend([item('s1', 'Milch')], [item('t1', 'Milch 1l', true)]);
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Milch 1l', untick: true }]);
  });

  it('leaves an open item with the same quantity alone', () => {
    const plan = planSend([item('s1', 'milch  1l')], [item('t1', 'Milch 1l')]);
    expect(plan.updates).toEqual([]);
    expect(plan.summary.alreadyOpen).toEqual(['Milch']);
  });

  it('adds unmatched items in source order', () => {
    const plan = planSend([item('s1', 'Hafermilch 2'), item('s2', 'Joghurt')], [item('t1', 'Milch', true)]);
    expect(plan.newItems).toEqual(['Hafermilch 2', 'Joghurt']);
    expect(plan.summary.added).toEqual(['Hafermilch 2', 'Joghurt']);
    expect(plan.updates).toEqual([]);
  });

  it('prefers a same-name match over a close one', () => {
    const plan = planSend([item('s1', 'Tomate')], [item('t1', 'Tomaten', true), item('t2', 'Tomate', true)]);
    expect(plan.updates.map((u) => u.itemId)).toEqual(['t2']);
    expect(plan.summary.closeMatches).toEqual([]);
  });

  it('prefers an open candidate, then the first', () => {
    expect(planSend([item('s1', 'Milch')], [item('t1', 'Milch', true), item('t2', 'Milch')]).summary.alreadyOpen).toEqual(['Milch']);
    expect(planSend([item('s1', 'Milch')], [item('t1', 'Milch', true), item('t2', 'Milch', true)]).updates.map((u) => u.itemId)).toEqual(['t1']);
  });

  it('uses the first of several close matches and flags it', () => {
    const plan = planSend([item('s1', 'Tomate')], [item('t1', 'Tomaten', true), item('t2', 'Tomates', true)]);
    expect(plan.updates.map((u) => u.itemId)).toEqual(['t1']);
    expect(plan.summary.closeMatches).toEqual(['Tomate → Tomaten']);
  });

  it('does not add the same new item twice in one send', () => {
    const plan = planSend([item('s1', 'Joghurt'), item('s2', 'joghurt')], []);
    expect(plan.newItems).toEqual(['Joghurt']);
    expect(plan.summary.alreadyOpen).toEqual(['Joghurt']);
  });
});
