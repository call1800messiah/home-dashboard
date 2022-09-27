import { Time } from '@angular/common';
import { IngredientRequirement } from './ingredient-requirement';

export interface Recipe {
  author: string;
  children: Recipe[];
  created: Date;
  edited: Date;
  editedBy: string;
  id: string;
  instructions: string;
  parent?: string;
  name: string;
  requirements: IngredientRequirement[];
  summary: string;
  time: Time;
}
