import { Recipe } from './recipe';

export interface SendIngredientsData {
  recipe: Recipe;
  servings: number;
  userID: string;
}
