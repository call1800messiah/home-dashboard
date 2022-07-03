import { IngredientType } from './ingredient-type';

export interface Ingredient {
  id: string;
  name: string;
  type: IngredientType;
}
