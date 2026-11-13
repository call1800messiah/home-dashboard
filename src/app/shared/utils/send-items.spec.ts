import {
  isCloseName, normalizeName, planSend, SendSource, SendTarget, sourceFromText, splitByName, splitQuantity,
} from './send-items';

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

function item(id: string, content: string, done = false): SendTarget {
  return { id, content, done };
}

function exact(name: string, quantity?: string): SendSource {
  return { content: quantity ? `${name} ${quantity}` : name, name, quantity, exactName: true };
}

describe('planSend', () => {
  it('reopens a ticked same-name item', () => {
    const plan = planSend([sourceFromText('Milch')], [item('t1', 'Milch', true)]);
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Milch', untick: true }]);
    expect(plan.summary.reopened).toEqual(['Milch']);
  });

  it('replaces the quantity and keeps the target name', () => {
    const plan = planSend([sourceFromText('Tomate 500g')], [item('t1', 'Tomaten 1kg', true)]);
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Tomaten 500g', untick: true }]);
    expect(plan.summary.closeMatches).toEqual(['Tomate → Tomaten']);
    expect(plan.summary.reopened).toEqual(['Tomaten 1kg → 500g']);
  });

  it('changes only the quantity of an open item', () => {
    const plan = planSend([sourceFromText('Milch 2l')], [item('t1', 'Milch 1l')]);
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Milch 2l', untick: false }]);
    expect(plan.summary.quantityChanged).toEqual(['Milch 1l → 2l']);
  });

  it('keeps the target quantity when the source has none', () => {
    const plan = planSend([sourceFromText('Milch')], [item('t1', 'Milch 1l', true)]);
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Milch 1l', untick: true }]);
  });

  it('leaves an open item with the same quantity alone', () => {
    const plan = planSend([sourceFromText('milch  1l')], [item('t1', 'Milch 1l')]);
    expect(plan.updates).toEqual([]);
    expect(plan.summary.alreadyOpen).toEqual(['Milch']);
  });

  it('adds unmatched items in source order', () => {
    const plan = planSend([sourceFromText('Hafermilch 2'), sourceFromText('Joghurt')], [item('t1', 'Milch', true)]);
    expect(plan.newItems).toEqual(['Hafermilch 2', 'Joghurt']);
    expect(plan.summary.added).toEqual(['Hafermilch 2', 'Joghurt']);
    expect(plan.updates).toEqual([]);
  });

  it('prefers a same-name match over a close one', () => {
    const plan = planSend([sourceFromText('Tomate')], [item('t1', 'Tomaten', true), item('t2', 'Tomate', true)]);
    expect(plan.updates.map((u) => u.itemId)).toEqual(['t2']);
    expect(plan.summary.closeMatches).toEqual([]);
  });

  it('prefers an open candidate, then the first', () => {
    expect(planSend([sourceFromText('Milch')], [item('t1', 'Milch', true), item('t2', 'Milch')]).summary.alreadyOpen).toEqual(['Milch']);
    expect(planSend([sourceFromText('Milch')], [item('t1', 'Milch', true), item('t2', 'Milch', true)]).updates.map((u) => u.itemId)).toEqual(['t1']);
  });

  it('uses the first of several close matches and flags it', () => {
    const plan = planSend([sourceFromText('Tomate')], [item('t1', 'Tomaten', true), item('t2', 'Tomates', true)]);
    expect(plan.updates.map((u) => u.itemId)).toEqual(['t1']);
    expect(plan.summary.closeMatches).toEqual(['Tomate → Tomaten']);
  });

  it('does not add the same new item twice in one send', () => {
    const plan = planSend([sourceFromText('Joghurt'), sourceFromText('joghurt')], []);
    expect(plan.newItems).toEqual(['Joghurt']);
    expect(plan.summary.alreadyOpen).toEqual(['Joghurt']);
  });
});

describe('planSend in add mode', () => {
  it('adds to an open item with the same unit', () => {
    const plan = planSend([exact('Mehl', '500 g')], [item('t1', 'Mehl 200 g')], 'add');
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Mehl 700 g', untick: false }]);
    expect(plan.summary.quantityIncreased).toEqual(['Mehl 200 g → 700 g']);
  });
  it('adds again when the same recipe is sent twice', () => {
    const plan = planSend([exact('Mehl', '500 g')], [item('t1', 'Mehl 500 g')], 'add');
    expect(plan.updates[0].content).toBe('Mehl 1000 g');
  });
  it('reopens a ticked item with the recipe amount', () => {
    const plan = planSend([exact('Mehl', '500 g')], [item('t1', 'Mehl 200 g', true)], 'add');
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Mehl 500 g', untick: true }]);
    expect(plan.summary.reopened).toEqual(['Mehl 200 g → 500 g']);
  });
  it('replaces and reports a different unit', () => {
    const plan = planSend([exact('Eier', '3')], [item('t1', 'Eier 1 Packung')], 'add');
    expect(plan.updates[0].content).toBe('Eier 3');
    expect(plan.summary.quantityChanged).toEqual(['Eier 1 Packung → 3']);
  });
  it('gives an amountless open item the recipe amount', () => {
    const plan = planSend([exact('Mehl', '500 g')], [item('t1', 'Mehl')], 'add');
    expect(plan.updates[0].content).toBe('Mehl 500 g');
  });
  it('adds two lines for the same item in sequence', () => {
    const plan = planSend([exact('Butter', '100 g'), exact('Butter', '50 g')], [item('t1', 'Butter 250 g')], 'add');
    expect(plan.updates[0].content).toBe('Butter 400 g');
  });
  it('keeps a name with a number whole', () => {
    const plan = planSend([exact('Weizenmehl Type 405', '500 g')],
      [item('t1', 'Weizenmehl Type 550 1 kg'), item('t2', 'Weizenmehl Type 405 200 g')], 'add');
    expect(plan.updates).toEqual([{ itemId: 't2', content: 'Weizenmehl Type 405 700 g', untick: false }]);
  });
  it('adds a new item for a name with a number that is not on the list', () => {
    const plan = planSend([exact('Weizenmehl Type 405', '500 g')], [item('t1', 'Weizenmehl Type 550 1 kg')], 'add');
    expect(plan.newItems).toEqual(['Weizenmehl Type 405 500 g']);
  });
  it('does not match a longer name that starts with the ingredient', () => {
    const plan = planSend([exact('Mehl', '500 g')], [item('t1', 'Mehl Type 405 1 kg')], 'add');
    expect(plan.newItems).toEqual(['Mehl 500 g']);
  });
  it('matches ignoring case and keeps the list spelling', () => {
    const plan = planSend([exact('mehl', '500 g')], [item('t1', 'Mehl 200 g')], 'add');
    expect(plan.updates[0].content).toBe('Mehl 700 g');
  });
  it('joins two units of the same ingredient in a new item', () => {
    const plan = planSend([exact('Butter', '100 g'), exact('Butter', '1 EL')], [], 'add');
    expect(plan.newItems).toEqual(['Butter 100 g + 1 EL']);
    expect(plan.summary.added).toEqual(['Butter 100 g + 1 EL']);
  });
  it('joins a second unit to an item this send increased', () => {
    const plan = planSend([exact('Butter', '100 g'), exact('Butter', '1 EL')], [item('t1', 'Butter 250 g')], 'add');
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Butter 350 g + 1 EL', untick: false }]);
    expect(plan.summary.quantityIncreased).toEqual(['Butter 250 g → 350 g', 'Butter 350 g → 350 g + 1 EL']);
    expect(plan.summary.quantityChanged).toEqual([]);
  });
  it('keeps joining after a joined amount', () => {
    const plan = planSend([exact('Butter', '100 g'), exact('Butter', '1 EL'), exact('Butter', '50 g')], [], 'add');
    expect(plan.newItems).toEqual(['Butter 100 g + 1 EL + 50 g']);
  });
});

describe('splitByName', () => {
  it('splits off the amount', () => expect(splitByName('Weizenmehl Type 405 500 g', 'weizenmehl type 405')).toEqual({ name: 'Weizenmehl Type 405', quantity: '500 g' }));
  it('accepts a qualifier', () => expect(splitByName('Mehl ca. 1 kg', 'mehl')).toEqual({ name: 'Mehl', quantity: 'ca. 1 kg' }));
  it('accepts the bare name', () => expect(splitByName('Mehl', 'mehl')).toEqual({ name: 'Mehl' }));
  it('rejects a longer name', () => expect(splitByName('Mehl Type 405', 'mehl')).toBeUndefined());
});
