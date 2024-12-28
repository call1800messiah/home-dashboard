import type { FieldValue } from '@angular/fire/firestore';

export interface RecipeDbo {
  author?: string;
  created?: Date;
  edited: Date;
  editedBy: string;
  ingredients: Record<string, number | FieldValue>;
  ingredientUnits: Record<string, string | FieldValue>;
  instructions: string;
  name: string;
  parent?: string;
  summary: string;
  time: number;
  type?: string | FieldValue;
}
