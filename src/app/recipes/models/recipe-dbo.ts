export interface RecipeDbo {
  ingredients: Record<string, number>;
  ingredientUnits: Record<string, string>;
  instructions: string;
  name: string;
  summary: string;
  time: number;
}
