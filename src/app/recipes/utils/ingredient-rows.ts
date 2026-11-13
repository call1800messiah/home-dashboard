import { formatAmount } from '../../shared/utils/amounts';
import { SendSource } from '../../shared/utils/send-items';
import { IngredientRow } from '../models/ingredient-row';
import { Recipe } from '../models/recipe';

/** The main recipe's ingredients, then each sub-recipe's; the same ingredient and unit is merged. */
export function buildIngredientRows(recipe: Recipe): IngredientRow[] {
  const rows = new Map<string, IngredientRow>();
  for (const part of [recipe, ...recipe.children]) {
    for (const requirement of part.requirements) {
      const unit = (requirement.unit ?? '').trim();
      const key = `${requirement.ingredient.id}|${unit.toLowerCase()}`;
      const existing = rows.get(key);
      if (existing) {
        existing.amount += requirement.amount;
      } else {
        rows.set(key, { key, name: requirement.ingredient.name, amount: requirement.amount, unit });
      }
    }
  }
  return [...rows.values()];
}

/** The row's amount scaled to the servings, or undefined when there is no amount or no valid servings. */
export function rowQuantity(row: IngredientRow, servings: number): string | undefined {
  if (!(row.amount > 0) || !Number.isInteger(servings) || servings < 1) {
    return undefined;
  }
  const amount = formatAmount(row.amount * servings);
  return row.unit ? `${amount} ${row.unit}` : amount;
}

export function rowSource(row: IngredientRow, servings: number): SendSource {
  const quantity = rowQuantity(row, servings);
  return {
    content: quantity ? `${row.name} ${quantity}` : row.name,
    name: row.name,
    quantity,
    exactName: true,
  };
}
