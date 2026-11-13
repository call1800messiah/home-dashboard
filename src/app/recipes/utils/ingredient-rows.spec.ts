import { Recipe } from '../models/recipe';
import { IngredientRequirement } from '../models/ingredient-requirement';
import { IngredientRow } from '../models/ingredient-row';
import { buildIngredientRows, rowQuantity, rowSource } from './ingredient-rows';

function req(id: string, name: string, amount: number, unit: string): IngredientRequirement {
  return { amount, unit, ingredient: { id, name, type: 'x' } } as unknown as IngredientRequirement;
}

function recipe(requirements: IngredientRequirement[], children: Recipe[] = []): Recipe {
  return { requirements, children } as unknown as Recipe;
}

function row(name: string, amount: number, unit: string): IngredientRow {
  return { key: `${name}|${unit}`, name, amount, unit };
}

describe('ingredient rows', () => {
  it('lists the main recipe, then the sub-recipes', () => {
    const rows = buildIngredientRows(
      recipe([req('a', 'Mehl', 1, 'g')], [recipe([req('b', 'Zucker', 2, 'g')]), recipe([req('c', 'Salz', 3, 'g')])])
    );
    expect(rows.map(r => r.name)).toEqual(['Mehl', 'Zucker', 'Salz']);
    expect(rows[0].key).toBe('a|g');
  });

  it('merges the same ingredient with the same unit across parts', () => {
    const rows = buildIngredientRows(
      recipe([req('a', 'Mehl', 1, 'G')], [recipe([req('a', 'Mehl', 2, ' g ')])])
    );
    expect(rows.length).toBe(1);
    expect(rows[0].amount).toBe(3);
    expect(rows[0].unit).toBe('G');
  });

  it('keeps different units apart', () => {
    const rows = buildIngredientRows(
      recipe([req('a', 'Mehl', 1, 'g')], [recipe([req('a', 'Mehl', 2, 'EL')])])
    );
    expect(rows.length).toBe(2);
  });

  it('scales and rounds the quantity', () => {
    expect(rowQuantity(row('Öl', 1 / 3, 'EL'), 4)).toBe('1,33 EL');
  });

  it('trims the unit', () => {
    const rows = buildIngredientRows(recipe([req('a', 'Mehl', 10, ' g ')]));
    expect(rowQuantity(rows[0], 4)).toBe('40 g');
  });

  it('gives no quantity for no amount or invalid servings', () => {
    expect(rowQuantity(row('Salz', 0, ''), 4)).toBeUndefined();
    expect(rowQuantity(row('Salz', 1, ''), 0)).toBeUndefined();
    expect(rowQuantity(row('Salz', 1, ''), -1)).toBeUndefined();
    expect(rowQuantity(row('Salz', null as unknown as number, ''), 2)).toBeUndefined();
  });

  it('builds a source', () => {
    expect(rowSource(row('Salz', 0, ''), 4)).toEqual({
      content: 'Salz',
      name: 'Salz',
      quantity: undefined,
      exactName: true,
    });
    expect(rowSource(row('Mehl', 125, 'g'), 4)).toEqual({
      content: 'Mehl 500 g',
      name: 'Mehl',
      quantity: '500 g',
      exactName: true,
    });
  });
});
