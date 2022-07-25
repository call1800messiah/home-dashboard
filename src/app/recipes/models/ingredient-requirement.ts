import { Ingredient } from './ingredient';

export interface IngredientRequirement {
  amount: number;
  ingredient: Ingredient;
  unit: string;
}
