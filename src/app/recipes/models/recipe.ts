import { Time } from '@angular/common';
import { IngredientRequirement } from './ingredient-requirement';

export interface Recipe {
  id: string;
  ingredients: IngredientRequirement[];
  instructions: string;
  name: string;
  summary: string;
  time: Time;
}
